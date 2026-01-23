const express = require('express');
const { getTickerSnapshot } = require('../services/db');
const { sanitizeTicker } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/ticker/:ticker', async (req, res, next) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    const snapshot = await getTickerSnapshot(ticker);
    logger.debug('route/ticker', `ticker=${ticker}`);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
