const mysql = require('mysql');
const redis = require('redis');
require('dotenv').config();

// Подключение к MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'fingineer',
  password: process.env.DB_PASSWORD || 'Vol32z51',
  database: process.env.DB_NAME || 'fingineer',
});

connection.connect((err) => {
  if (err) {
    console.error('[MySQL] Ошибка подключения:', err);
    return;
  }
  console.log('[MySQL] Подключено.');
  connection.query("SET SESSION group_concat_max_len = 1000000", (err) => {
    if (err) console.error('[MySQL] Ошибка установки group_concat_max_len:', err);
  });
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(err => console.error('[Redis] Ошибка подключения:', err));

const getIntervalSeconds = (interval) => {
  const map = {
    '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
    '1h': 3600, '2h': 7200, '4h': 14400,
    '1d': 86400, '1w': 604800, '1M': 2592000
  };
  return map[interval] || 60;
};

async function getAggregatedCandles(ticker, interval, startDate, endDate) {
  if (!ticker || !startDate || !endDate || !interval) {
    console.error('[getAggregatedCandles] ❌ Недопустимые параметры', { ticker, interval, startDate, endDate });
    return [];
  }

  const intervalSec = getIntervalSeconds(interval);
  const cacheKey = `candles:${ticker}:${interval}:${startDate}:${endDate}`;

  try {
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[REDIS] Кэш найден: ${cacheKey}`);
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error(`[REDIS] Ошибка при чтении из кэша:`, error);
  }

  const query = `
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

  const params = [intervalSec, intervalSec, ticker, startDate, endDate];

  let results;
  try {
    results = await new Promise((resolve, reject) => {
      connection.query(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  } catch (err) {
    console.error('[MySQL] Ошибка запроса:', err);
    return [];
  }

  let candles = results.map(row => ({
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

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(candles));
      console.log(`[REDIS] Кэш обновлён: ${cacheKey}`);
    }
  } catch (err) {
    console.error('[REDIS] Ошибка записи в кэш:', err);
  }

  return candles;
}

module.exports = getAggregatedCandles;
