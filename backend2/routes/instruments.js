const express = require('express');
const { getBrowseInstruments } = require('../services/db');
const logger = require('../utils/logger');

const router = express.Router();

const BROWSE_FILTERS = [
  { id: 'all', label: '\u0412\u0441\u0435' },
  { id: 'share', label: '\u0410\u043a\u0446\u0438\u0438' },
  { id: 'fund', label: '\u0424\u043e\u043d\u0434\u044b' },
  { id: 'index', label: '\u0418\u043d\u0434\u0435\u043a\u0441\u044b' },
];

const ALLOWED_TYPES = new Set(BROWSE_FILTERS.map((filter) => filter.id));
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function normalizeType(rawType) {
  return String(rawType || 'all').trim().toLowerCase();
}

function normalizeLimit(rawLimit) {
  const parsed = Number.parseInt(String(rawLimit || ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

router.get('/instruments/browse', async (req, res, next) => {
  try {
    const type = normalizeType(req.query.type);
    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: '\u041d\u0435\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043c\u044b\u0439 \u0442\u0438\u043f \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430' });
    }

    const limit = normalizeLimit(req.query.limit);
    const items = await getBrowseInstruments({ type, limit });

    logger.debug('route/instruments', `browse type="${type}" limit=${limit} results=${items.length}`);
    return res.json({
      items,
      filters: BROWSE_FILTERS,
      counts: null,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
