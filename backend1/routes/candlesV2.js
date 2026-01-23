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
    const perfEnabled = process.env.FG_PERF === '1';
    const perfStart = perfEnabled ? process.hrtime.bigint() : 0n;
    const reqId = perfEnabled
      ? (req.id || req.headers['x-request-id'] || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)
      : null;

    const result = await getCandlesV2(req.query);
    const payload = result;

    if (perfEnabled) {
      const q = req.query || {};
      const ticker = (q.ticker ?? '').toString();
      const interval = (q.interval ?? '').toString();
      const from = (q.from ?? '').toString();
      const to = (q.to ?? '').toString();
      const countBack = (q.countBack ?? '').toString();
      const rows = Array.isArray(payload?.candles) ? payload.candles.length : 0;
      const buildStart = process.hrtime.bigint();
      const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      const buildMs = Number(process.hrtime.bigint() - buildStart) / 1e6;
      const totalMs = Number(process.hrtime.bigint() - perfStart) / 1e6;
      logger.info(
        'perf',
        `[FG][perf][candles] reqId=${reqId} ticker=${ticker} interval=${interval} from=${from} to=${to} countBack=${countBack} status=200 totalMs=${totalMs.toFixed(1)} buildMs=${buildMs.toFixed(1)} rows=${rows} bytes=${bytes}`
      );
    }

    return res.json(payload);
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
