const express = require('express');
const { query } = require('../services/db');
const { sanitizeTicker } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/ticker/:searchQuery', async (req, res, next) => {
  try {
    const ticker = sanitizeTicker(req.params.searchQuery);
    if (!ticker) {
      return res.status(400).json({ error: 'Не указан тикер' });
    }

    let lastDate = '2023-01-02';

    try {
      const rows = await query(
        "SELECT MAX(DATE(SYSTIME)) as maxDate FROM moex_marketdata WHERE SECID = ? AND BOARDID = 'TQBR'",
        [ticker],
      );
      if (rows && rows[0]?.maxDate) {
        const dateObj = new Date(rows[0].maxDate);
        if (!Number.isNaN(dateObj.getTime())) {
          lastDate = dateObj.toISOString().slice(0, 10);
        }
      }
    } catch (err) {
      logger.error('route/ticker', 'Failed to retrieve maxDate', err);
    }

    let lastPrice = null;
    try {
      const rows = await query(
        "SELECT CLOSE as close, SYSTIME FROM moex_marketdata WHERE SECID=? AND BOARDID='TQBR' AND DATE(SYSTIME)=? ORDER BY SYSTIME DESC LIMIT 1",
        [ticker, lastDate],
      );
      if (rows && rows[0]) {
        lastPrice = Number(rows[0].close);
      }
    } catch (err) {
      logger.error('route/ticker', 'Failed to retrieve last price', err);
    }

    let dayVolume = null;
    try {
      const rows = await query(
        "SELECT SUM(VOLTODAY) AS dayVolume FROM moex_marketdata WHERE SECID=? AND BOARDID='TQBR' AND DATE(SYSTIME)=?",
        [ticker, lastDate],
      );
      if (rows && rows[0] && rows[0].dayVolume != null) {
        dayVolume = Number(rows[0].dayVolume);
      }
    } catch (err) {
      logger.error('route/ticker', 'Failed to retrieve day volume', err);
    }

    let prevDate = null;
    try {
      const rows = await query(
        "SELECT MAX(DATE(SYSTIME)) as prevDate FROM moex_marketdata WHERE SECID=? AND BOARDID='TQBR' AND DATE(SYSTIME) < ?",
        [ticker, lastDate],
      );
      if (rows && rows[0]?.prevDate) {
        const dateObj = new Date(rows[0].prevDate);
        if (!Number.isNaN(dateObj.getTime())) {
          prevDate = dateObj.toISOString().slice(0, 10);
        }
      }
    } catch (err) {
      logger.error('route/ticker', 'Failed to retrieve previous date', err);
    }

    let prevClose = null;
    if (prevDate) {
      try {
        const rows = await query(
          "SELECT CLOSE as close FROM moex_marketdata WHERE SECID=? AND BOARDID='TQBR' AND DATE(SYSTIME)=? ORDER BY SYSTIME DESC LIMIT 1",
          [ticker, prevDate],
        );
        if (rows && rows[0]) {
          prevClose = Number(rows[0].close);
        }
      } catch (err) {
        logger.error('route/ticker', 'Failed to retrieve previous close', err);
      }
    }

    const normalizedPrevClose = Number.isFinite(prevClose) ? prevClose : null;
    const normalizedLastPrice = Number.isFinite(lastPrice) ? lastPrice : null;

    const dayChangePct = (
      normalizedPrevClose !== null
      && normalizedLastPrice !== null
      && normalizedPrevClose !== 0
    )
      ? ((normalizedLastPrice - normalizedPrevClose) / normalizedPrevClose) * 100
      : null;

    return res.json({
      ticker,
      companyName: `Название компании для ${ticker}`,
      date: lastDate,
      time: '00:00:00',
      sector: 'Сектор Мосбиржи',
      exchange: 'MOEX',
      lastPrice: normalizedLastPrice,
      prevClose: normalizedPrevClose,
      dayChangePct,
      volume: dayVolume,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
