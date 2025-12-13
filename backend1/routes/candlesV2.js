const express = require('express');
const logger = require('../utils/logger');
const {
  getCandlesV2,
  CandlesV2Error,
} = require('../services/candlesV2Service');

const router = express.Router();

// GET /candles-v2?ticker=...&interval=1m&from=...&to=...&countBack=...
router.get('/candles-v2', async (req, res, next) => {
  try {
    const result = await getCandlesV2(req.query);
    return res.json(result);
  } catch (err) {
    if (err instanceof CandlesV2Error) {
      logger.warn('candles-v2', 'Validation error', {
        message: err.message,
        statusCode: err.statusCode,
        query: req.query,
      });

      const status = err.statusCode || 400;

      return res.status(status).json({
        error: {
          code: status,
          message: err.message,
        },
      });
    }

    logger.error('candles-v2', 'Unexpected error', err);
    return next(err);
  }
});

module.exports = router;
