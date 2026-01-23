const mysql = require('mysql');
const config = require('../config/env');
const logger = require('../utils/logger');
const cache = require('./cache');

const LAST_TIME_TTL_SEC = 30;       // TEMP: keep short for freshness (MOEX updates)
const FIRST_TIME_TTL_SEC = 60 * 60; // TEMP: rarely changes

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

  const perfEnabled = process.env.FG_PERF === '1';
  const perfStart = perfEnabled ? process.hrtime.bigint() : 0n;
  let redisGetMs = 0;
  let mysqlQueryMs = 0;
  let redisSetMs = 0;

  const intervalSec = getIntervalSeconds(interval);
  const cacheKey = `candles:${ticker}:${interval}:${startDate}:${endDate}`;

  const logPerf = (cacheHit, rows) => {
    if (!perfEnabled) return;
    const totalMs = Number(process.hrtime.bigint() - perfStart) / 1e6;
    logger.info(
      'perf',
      `[FG][perf][dbCandles] cacheHit=${cacheHit} redisGetMs=${redisGetMs.toFixed(1)} mysqlMs=${mysqlQueryMs.toFixed(1)} redisSetMs=${redisSetMs.toFixed(1)} totalMs=${totalMs.toFixed(1)} rows=${rows} key=${cacheKey}`
    );
  };

  let cached;
  if (perfEnabled) {
    const redisStart = process.hrtime.bigint();
    cached = await cache.get(cacheKey);
    redisGetMs = Number(process.hrtime.bigint() - redisStart) / 1e6;
  } else {
    cached = await cache.get(cacheKey);
  }
  if (cached) {
    logger.debug('db', `Cache hit for ${cacheKey}`);
    logPerf(true, Array.isArray(cached) ? cached.length : 0);
    return cached;
  }

  // Для дневных свечей якорим время на дату по МСК, а не на сутки UTC.
  const timeExpr =
    intervalSec === 86400
      ? "UNIX_TIMESTAMP(DATE(CONVERT_TZ(SYSTIME, '+00:00', '+03:00')))"
      : "FLOOR(UNIX_TIMESTAMP(SYSTIME) / ?) * ?";

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
            ${timeExpr} AS time,
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

  const params =
    intervalSec === 86400
      ? [ticker, startDate, endDate]
      : [intervalSec, intervalSec, ticker, startDate, endDate];

  try {
    let rows;
    if (perfEnabled) {
      const dbStart = process.hrtime.bigint();
      rows = await query(sql, params);
      mysqlQueryMs = Number(process.hrtime.bigint() - dbStart) / 1e6;
    } else {
      rows = await query(sql, params);
    }
    let candles = rows.map((row) => ({
      time: Number(row.time),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));

    // Не режем массив свечей на бэкенде:
    // фронтенд сам применяет LOD/децимацию по timeframe/interval
    // и выбирает эффективный интервал отображения.

    if (candles.length) {
      if (perfEnabled) {
        const redisStart = process.hrtime.bigint();
        await cache.set(cacheKey, candles);
        redisSetMs = Number(process.hrtime.bigint() - redisStart) / 1e6;
      } else {
        await cache.set(cacheKey, candles);
      }
      logger.debug('db', `Cache set for ${cacheKey} (${candles.length} candles)`);
    }

    logPerf(false, candles.length);
    return candles;
  } catch (err) {
    logger.error('db', 'Failed to aggregate candles', err);
    logPerf(false, 0);
    return [];
  }
}

async function getLastCandleTime(ticker) {
  if (!ticker) {
    return null;
  }

  const perfEnabled = process.env.FG_PERF === '1';
  const t0 = perfEnabled ? process.hrtime.bigint() : 0n;
  const tkr = String(ticker).toUpperCase();
  const cacheKey = `candles:lastTime:${tkr}`;

  // Redis read (fast path)
  let redisGetMs = 0;
  if (perfEnabled) {
    const r0 = process.hrtime.bigint();
    const cached = await cache.get(cacheKey);
    redisGetMs = Number(process.hrtime.bigint() - r0) / 1e6;
    if (Number.isFinite(cached)) {
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=last ticker=${tkr} cacheHit=true redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=0.0 redisSetMs=0.0 totalMs=${totalMs.toFixed(1)}`
      );
      return cached;
    }
  } else {
    const cached = await cache.get(cacheKey);
    if (Number.isFinite(cached)) return cached;
  }

  const sql = `
    SELECT MAX(SYSTIME) AS maxTime
    FROM moex_marketdata
    WHERE SECID = ? AND BOARDID = 'TQBR'
  `;

  try {
    const db0 = perfEnabled ? process.hrtime.bigint() : 0n;
    const rows = await query(sql, [tkr]);
    const mysqlMs = perfEnabled ? Number(process.hrtime.bigint() - db0) / 1e6 : 0;

    if (!rows || rows.length === 0 || !rows[0].maxTime) {
      if (perfEnabled) {
        const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
        logger.info(
          'perf',
          `[FG][perf][dbLastFirst] fn=last ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
            1
          )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=noRows`
        );
      }
      return null;
    }

    const raw = rows[0].maxTime; // "YYYY-MM-DD hh:mm:ss" as string (dateStrings: true)
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      logger.warn('db', 'Failed to parse maxTime for ticker', { ticker, raw });
      if (perfEnabled) {
        const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
        logger.info(
          'perf',
          `[FG][perf][dbLastFirst] fn=last ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
            1
          )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=parseFail`
        );
      }
      return null;
    }

    const unixSec = Math.floor(parsed.getTime() / 1000);

    // Redis write (only if valid)
    let redisSetMs = 0;
    if (perfEnabled) {
      const r1 = process.hrtime.bigint();
      await cache.set(cacheKey, unixSec, LAST_TIME_TTL_SEC);
      redisSetMs = Number(process.hrtime.bigint() - r1) / 1e6;
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=last ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=${redisSetMs.toFixed(1)} totalMs=${totalMs.toFixed(
          1
        )} ttlSec=${LAST_TIME_TTL_SEC}`
      );
    } else {
      await cache.set(cacheKey, unixSec, LAST_TIME_TTL_SEC);
    }

    return unixSec;
  } catch (err) {
    logger.error('db', 'Error in getLastCandleTime', { ticker, err });
    if (perfEnabled) {
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=last ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=err redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=exception`
      );
    }
    return null;
  }
}

async function getFirstCandleTime(ticker) {
  if (!ticker) {
    return null;
  }

  const perfEnabled = process.env.FG_PERF === '1';
  const t0 = perfEnabled ? process.hrtime.bigint() : 0n;
  const tkr = String(ticker).toUpperCase();
  const cacheKey = `candles:firstTime:${tkr}`;

  // Redis read (fast path)
  let redisGetMs = 0;
  if (perfEnabled) {
    const r0 = process.hrtime.bigint();
    const cached = await cache.get(cacheKey);
    redisGetMs = Number(process.hrtime.bigint() - r0) / 1e6;
    if (Number.isFinite(cached)) {
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=first ticker=${tkr} cacheHit=true redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=0.0 redisSetMs=0.0 totalMs=${totalMs.toFixed(1)}`
      );
      return cached;
    }
  } else {
    const cached = await cache.get(cacheKey);
    if (Number.isFinite(cached)) return cached;
  }

  const sql = `
    SELECT MIN(SYSTIME) AS firstTime
    FROM moex_marketdata
    WHERE SECID = ? AND BOARDID = 'TQBR'
  `;

  try {
    const db0 = perfEnabled ? process.hrtime.bigint() : 0n;
    const rows = await query(sql, [tkr]);
    const mysqlMs = perfEnabled ? Number(process.hrtime.bigint() - db0) / 1e6 : 0;

    if (!rows || rows.length === 0 || !rows[0].firstTime) {
      if (perfEnabled) {
        const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
        logger.info(
          'perf',
          `[FG][perf][dbLastFirst] fn=first ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
            1
          )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=noRows`
        );
      }
      return null;
    }

    const raw = rows[0].firstTime; // "YYYY-MM-DD hh:mm:ss" as string (dateStrings: true)
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      logger.warn('db', 'Failed to parse firstTime for ticker', { ticker, raw });
      if (perfEnabled) {
        const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
        logger.info(
          'perf',
          `[FG][perf][dbLastFirst] fn=first ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
            1
          )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=parseFail`
        );
      }
      return null;
    }

    const unixSec = Math.floor(parsed.getTime() / 1000);

    // Redis write (only if valid)
    let redisSetMs = 0;
    if (perfEnabled) {
      const r1 = process.hrtime.bigint();
      await cache.set(cacheKey, unixSec, FIRST_TIME_TTL_SEC);
      redisSetMs = Number(process.hrtime.bigint() - r1) / 1e6;
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=first ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=${mysqlMs.toFixed(1)} redisSetMs=${redisSetMs.toFixed(1)} totalMs=${totalMs.toFixed(
          1
        )} ttlSec=${FIRST_TIME_TTL_SEC}`
      );
    } else {
      await cache.set(cacheKey, unixSec, FIRST_TIME_TTL_SEC);
    }

    return unixSec;
  } catch (err) {
    logger.error('db', 'Error in getFirstCandleTime', { ticker, err });
    if (perfEnabled) {
      const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][dbLastFirst] fn=first ticker=${tkr} cacheHit=false redisGetMs=${redisGetMs.toFixed(
          1
        )} mysqlMs=err redisSetMs=0.0 totalMs=${totalMs.toFixed(1)} note=exception`
      );
    }
    return null;
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
  getFirstCandleTime,
  getLastCandleTime,
  closePool,
};
