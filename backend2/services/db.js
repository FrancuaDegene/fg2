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
  const startsWith = `${lower}%`;
  const contains = `%${lower}%`;

  const sql = `
    SELECT
      ticker_symbol AS ticker,
      full_name AS company_name,
      CASE
        WHEN LOWER(ticker_symbol) LIKE ? THEN 0
        WHEN LOWER(full_name) LIKE ? THEN 1
        ELSE 2
      END AS priority
    FROM ticker_mapping
    WHERE LOWER(ticker_symbol) LIKE ? OR LOWER(full_name) LIKE ?
    ORDER BY priority, ticker_symbol
    LIMIT 20
  `;

  const rows = await execute(sql, [startsWith, startsWith, contains, contains]);
  return rows.map((row) => ({
    ticker: row.ticker,
    company_name: row.company_name,
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
  getTickerSnapshot,
  getNews,
  getDividends,
  closePool,
};
