const mysql = require('mysql');
const config = require('../config/env');
const logger = require('../utils/logger');
const cache = require('./cache');

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: true,
});

pool.on('connection', (connection) => {
  connection.query("SET SESSION group_concat_max_len = 1000000", (err) => {
    if (err) {
      logger.error('db', 'Failed to set group_concat_max_len', err);
    }
  });
});

pool.on('error', (err) => {
  logger.error('db', 'MySQL pool error', err);
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

const getIntervalSeconds = (interval) => {
  const map = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
    '1M': 2592000,
  };
  return map[interval] || 60;
};

async function getAggregatedCandles(ticker, interval, startDate, endDate) {
  if (!ticker || !interval || !startDate || !endDate) {
    logger.warn('db', 'Invalid parameters for getAggregatedCandles', { ticker, interval, startDate, endDate });
    return [];
  }

  const intervalSec = getIntervalSeconds(interval);
  const cacheKey = `candles:${ticker}:${interval}:${startDate}:${endDate}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.debug('db', `Cache hit for ${cacheKey}`);
    return cached;
  }

  const sql = `
    SELECT
        time,
        SUBSTRING_INDEX(GROUP_CONCAT(CAST(open AS CHAR) ORDER BY SYSTIME ASC), ',', 1) AS open,
        MAX(high) AS high,
        MIN(low) AS low,
        SUBSTRING_INDEX(GROUP_CONCAT(CAST(close AS CHAR) ORDER BY SYSTIME ASC), ',', -1) AS close,
        SUM(volume) AS volume
    FROM (
        SELECT
            FLOOR(UNIX_TIMESTAMP(SYSTIME) / ?) * ? AS time,
            SYSTIME,
            OPEN,
            HIGH,
            LOW,
            CLOSE,
            VOLTODAY AS volume
        FROM moex_marketdata
        WHERE SECID = ? AND BOARDID = 'TQBR' AND SYSTIME BETWEEN ? AND ?
    ) as source
    GROUP BY time
    ORDER BY time ASC;
  `;

  try {
    const rows = await query(sql, [intervalSec, intervalSec, ticker, startDate, endDate]);
    let candles = rows.map((row) => ({
      time: Number(row.time),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));

    if (candles.length > 3000) {
      candles = candles.slice(-3000);
    }

    if (candles.length) {
      await cache.set(cacheKey, candles);
      logger.debug('db', `Cache set for ${cacheKey} (${candles.length} candles)`);
    }

    return candles;
  } catch (err) {
    logger.error('db', 'Failed to aggregate candles', err);
    return [];
  }
}

function closePool() {
  return new Promise((resolve) => {
    pool.end((err) => {
      if (err) {
        logger.error('db', 'Error closing MySQL pool', err);
      } else {
        logger.info('db', 'MySQL pool closed');
      }
      resolve();
    });
  });
}

module.exports = {
  query,
  getAggregatedCandles,
  closePool,
};
