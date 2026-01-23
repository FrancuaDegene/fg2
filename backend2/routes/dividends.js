const express = require('express');
const { getDividends } = require('../services/db');
const { sanitizeSearchQuery } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/dividends', async (req, res, next) => {
  try {
    const ticker = sanitizeSearchQuery(req.query.searchQuery);
    const dividends = await getDividends(ticker);
    logger.debug('route/dividends', `ticker=${ticker} count=${dividends.length}`);
    res.json(dividends);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
