const mysql = require('mysql2/promise');
const config = require('../config/env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit || 10,
  queueLimit: 0,
  connectTimeout: config.db.connectTimeout || 10_000,
  timezone: 'Z',
});

(async () => {
  try {
    await pool.query('SET SESSION group_concat_max_len = 1000000');
  } catch (err) {
    logger.error('db', 'Не удалось установить group_concat_max_len', err);
  }
})();

async function execute(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    logger.error('db', `Ошибка SQL: ${err.message}`, err);
    throw err;
  }
}

async function getSuggestions(queryInput) {
  const lower = queryInput.toLowerCase();
  const exact = lower;
  const startsWith = `${lower}%`;
  const contains = `%${lower}%`;

  const sql = `
    WITH moex_ranked AS (
      SELECT
        ms.SECID AS ticker,
        ms.SHORTNAME,
        ms.SECNAME,
        ms.INSTRID,
        ms.SECTYPE,
        ms.CURRENCYID,
        ms.BOARDID,
        ms.STATUS,
        ROW_NUMBER() OVER (
          PARTITION BY ms.SECID
          ORDER BY
            CASE
              WHEN ms.INSTRID = 'EQIN' AND ms.BOARDID = 'TQBR' THEN 1
              WHEN ms.INSTRID = 'IFTF' AND ms.BOARDID = 'TQTF' THEN 1
              WHEN ms.BOARDID = 'TQBR' THEN 2
              WHEN ms.BOARDID = 'TQTF' THEN 3
              WHEN ms.BOARDID = 'SMAL' THEN 4
              WHEN ms.BOARDID = 'SPEQ' THEN 5
              ELSE 9
            END,
            CASE WHEN ms.STATUS = 'A' THEN 0 ELSE 1 END,
            ms.SECID
        ) AS rn
      FROM moex_securities ms
      WHERE ms.SECID IS NOT NULL
    ),
    moex_canonical AS (
      SELECT
        ticker,
        COALESCE(NULLIF(SHORTNAME, ''), NULLIF(SECNAME, ''), ticker) AS displayName,
        CASE
          WHEN INSTRID = 'EQIN' AND SECTYPE IN ('1', '2') THEN 'share'
          WHEN INSTRID = 'IFTF' AND SECTYPE = 'J' THEN 'fund'
          ELSE 'instrument'
        END AS instrumentType,
        CASE
          WHEN INSTRID = 'EQIN' AND SECTYPE = '1' THEN 'ordinary'
          WHEN INSTRID = 'EQIN' AND SECTYPE = '2' THEN 'preferred'
          ELSE NULL
        END AS shareClass,
        NULL AS country,
        'MOEX' AS exchange,
        CURRENCYID AS currency,
        BOARDID AS board,
        STATUS AS status,
        'moex_securities' AS sourceTable
      FROM moex_ranked
      WHERE rn = 1
    ),
    d_tickers_supplement AS (
      SELECT
        d.secid AS ticker,
        COALESCE(NULLIF(d.name, ''), d.secid) AS displayName,
        CASE
          WHEN d.secid = 'IMOEX' THEN 'index'
          ELSE 'instrument'
        END AS instrumentType,
        NULL AS shareClass,
        d.country AS country,
        'MOEX' AS exchange,
        NULL AS currency,
        NULL AS board,
        NULL AS status,
        'd_tickers' AS sourceTable
      FROM d_tickers d
      WHERE d.secid IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM moex_canonical m
          WHERE m.ticker = d.secid
        )
    ),
    normalized AS (
      SELECT * FROM moex_canonical
      UNION ALL
      SELECT * FROM d_tickers_supplement
    )
    SELECT
      ticker,
      displayName AS company_name,
      displayName,
      instrumentType,
      shareClass,
      country,
      exchange,
      currency,
      board,
      status,
      sourceTable
    FROM normalized
    WHERE
      LOWER(ticker) = LOWER(?)
      OR LOWER(ticker) LIKE LOWER(?)
      OR LOWER(displayName) LIKE LOWER(?)
      OR LOWER(displayName) LIKE LOWER(?)
    ORDER BY
      CASE
        WHEN LOWER(ticker) = LOWER(?) THEN 0
        WHEN LOWER(ticker) LIKE LOWER(?) THEN 1
        WHEN LOWER(displayName) LIKE LOWER(?) THEN 2
        ELSE 3
      END,
      ticker
    LIMIT 20
  `;

  const rows = await execute(sql, [
    exact,
    startsWith,
    startsWith,
    contains,
    exact,
    startsWith,
    startsWith,
  ]);
  return rows.map((row) => ({
    ticker: row.ticker,
    company_name: row.company_name,
    displayName: row.displayName,
    instrumentType: row.instrumentType,
    shareClass: row.shareClass,
    country: row.country,
    exchange: row.exchange,
    currency: row.currency,
    board: row.board,
    status: row.status,
    sourceTable: row.sourceTable,
  }));
}

async function getBrowseInstruments({ type = 'all', limit = 20 } = {}) {
  const allowedTypes = new Set(['all', 'share', 'fund', 'index']);
  const normalizedType = allowedTypes.has(type) ? type : 'all';
  const selectedTypes = normalizedType === 'all' ? ['share', 'fund', 'index'] : [normalizedType];
  const typeCondition = selectedTypes.map((itemType) => `'${itemType}'`).join(', ');
  const normalizedLimit = Math.min(Math.max(Number.parseInt(String(limit), 10) || 20, 1), 50);

  const sql = `
    WITH moex_ranked AS (
      SELECT
        ms.SECID AS ticker,
        ms.SHORTNAME,
        ms.SECNAME,
        ms.INSTRID,
        ms.SECTYPE,
        ms.CURRENCYID,
        ms.BOARDID,
        ms.STATUS,
        ROW_NUMBER() OVER (
          PARTITION BY ms.SECID
          ORDER BY
            CASE
              WHEN ms.INSTRID = 'EQIN' AND ms.BOARDID = 'TQBR' THEN 1
              WHEN ms.INSTRID = 'IFTF' AND ms.BOARDID = 'TQTF' THEN 1
              WHEN ms.BOARDID = 'TQBR' THEN 2
              WHEN ms.BOARDID = 'TQTF' THEN 3
              WHEN ms.BOARDID = 'SMAL' THEN 4
              WHEN ms.BOARDID = 'SPEQ' THEN 5
              ELSE 9
            END,
            CASE WHEN ms.STATUS = 'A' THEN 0 ELSE 1 END,
            ms.SECID
        ) AS rn
      FROM moex_securities ms
      WHERE ms.SECID IS NOT NULL
    ),
    moex_canonical AS (
      SELECT
        ticker,
        COALESCE(NULLIF(SHORTNAME, ''), NULLIF(SECNAME, ''), ticker) AS displayName,
        CASE
          WHEN INSTRID = 'EQIN' AND SECTYPE IN ('1', '2') THEN 'share'
          WHEN INSTRID = 'IFTF' AND SECTYPE = 'J' THEN 'fund'
          ELSE 'instrument'
        END AS instrumentType,
        CASE
          WHEN INSTRID = 'EQIN' AND SECTYPE = '1' THEN 'ordinary'
          WHEN INSTRID = 'EQIN' AND SECTYPE = '2' THEN 'preferred'
          ELSE NULL
        END AS shareClass,
        NULL AS country,
        'MOEX' AS exchange,
        CURRENCYID AS currency,
        BOARDID AS board,
        STATUS AS status,
        'moex_securities' AS sourceTable,
        1 AS sourcePriority,
        CASE
          WHEN BOARDID = 'TQBR' THEN 1
          WHEN BOARDID = 'TQTF' THEN 2
          ELSE 9
        END AS boardPriority,
        CASE WHEN STATUS = 'A' THEN 0 ELSE 1 END AS statusPriority
      FROM moex_ranked
      WHERE rn = 1
    ),
    safe_index_supplement AS (
      SELECT
        d.secid AS ticker,
        COALESCE(NULLIF(d.name, ''), d.secid) AS displayName,
        'index' AS instrumentType,
        NULL AS shareClass,
        d.country AS country,
        'MOEX' AS exchange,
        NULL AS currency,
        NULL AS board,
        NULL AS status,
        'd_tickers' AS sourceTable,
        2 AS sourcePriority,
        9 AS boardPriority,
        1 AS statusPriority
      FROM d_tickers d
      WHERE d.secid = 'IMOEX'
        AND NOT EXISTS (
          SELECT 1
          FROM moex_canonical m
          WHERE m.ticker = d.secid
        )
    ),
    normalized AS (
      SELECT *
      FROM moex_canonical
      WHERE instrumentType IN ('share', 'fund')
      UNION ALL
      SELECT *
      FROM safe_index_supplement
    )
    SELECT
      ticker,
      displayName AS company_name,
      displayName,
      instrumentType,
      shareClass,
      country,
      exchange,
      currency,
      board,
      status,
      sourceTable
    FROM normalized
    WHERE instrumentType IN (${typeCondition})
    ORDER BY sourcePriority, boardPriority, statusPriority, ticker
    LIMIT ${normalizedLimit}
  `;

  const rows = await execute(sql);
  return rows.map((row) => ({
    ticker: row.ticker,
    company_name: row.company_name,
    displayName: row.displayName,
    instrumentType: row.instrumentType,
    shareClass: row.shareClass,
    country: row.country,
    exchange: row.exchange,
    currency: row.currency,
    board: row.board,
    status: row.status,
    sourceTable: row.sourceTable,
  }));
}

async function getTickerSnapshot(ticker) {
  const securityRows = await execute(
    'SELECT * FROM moex_securities WHERE SECID = ? AND BOARDID = "TQBR" LIMIT 1',
    [ticker],
  );

  if (!securityRows.length) {
    const error = new Error('Тикер не найден');
    error.status = 404;
    throw error;
  }

  const securityData = securityRows[0];

  const marketRows = await execute(
    'SELECT * FROM moex_marketdata WHERE SECID = ? AND BOARDID = "TQBR" ORDER BY SYSTIME DESC, TIME DESC LIMIT 1',
    [ticker],
  );
  const marketData = marketRows[0] || {};

  const descriptionRows = await execute(
    'SELECT description FROM tgbot_ticker_list WHERE name = ? ORDER BY description ASC',
    [ticker],
  );
  const descriptionData = descriptionRows[0] || {};
  const board = securityData.BOARDID || null;
  const boardLabel = securityData.BOARDNAME || null;
  const sectorCode = securityData.SECTORID || null;
  const marketDataDate = marketData.SYSTIME || null;
  const marketDataTime = marketData.TIME || null;

  return {
    companyName: securityData.SECNAME || 'N/A',
    ticker: securityData.SECID || 'N/A',
    date: marketData.SYSTIME || 'N/A',
    time: marketData.TIME || 'N/A',
    closingPrice: marketData.LAST || 'N/A',
    openingPrice: marketData.OPEN || 'N/A',
    minPrice: marketData.LOW || 'N/A',
    maxPrice: marketData.HIGH || 'N/A',
    description: descriptionData.description || 'Описание недоступно',
    sector: securityData.SECTORID || '—',
    exchange: securityData.BOARDID || '—',
    board,
    boardLabel,
    exchangeLabel: 'MOEX',
    sectorCode,
    sectorLabel: null,
    marketDataDate,
    marketDataTime,
    identitySource: 'moex_securities',
    dividendYield: '—',
  };
}

async function getNews() {
  return execute(
    'SELECT title, content, created_at FROM blog_posts ORDER BY created_at DESC',
  );
}

async function getDividends(searchQuery) {
  const sql = `
    SELECT
      list_section,
      issuer_full_name AS company_name,
      inn,
      DATE_FORMAT(decision_date, '%Y-%m-%d') AS decision_date,
      security_type,
      registration_number AS isin,
      DATE_FORMAT(registration_date, '%Y-%m-%d') AS registration_date,
      dividends_2018,
      median_price_2018,
      yield_2018,
      dividends_2019,
      median_price_2019,
      yield_2019,
      dividends_2020,
      median_price_2020,
      yield_2020,
      dividend_history,
      dividend_policy,
      secid
    FROM moex_dividend_yields
    WHERE UPPER(secid) = UPPER(?)
    ORDER BY decision_date DESC
  `;

  const rows = await execute(sql, [searchQuery]);
  if (!rows.length) {
    const error = new Error('Данные по тикеру не найдены');
    error.status = 404;
    throw error;
  }
  return rows;
}

async function closePool() {
  try {
    await pool.end();
    logger.info('db', 'Пул MySQL закрыт');
  } catch (err) {
    logger.error('db', 'Ошибка при закрытии пула MySQL', err);
  }
}

module.exports = {
  getSuggestions,
  getBrowseInstruments,
  getTickerSnapshot,
  getNews,
  getDividends,
  closePool,
};
