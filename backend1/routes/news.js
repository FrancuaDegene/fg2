const express = require('express');
const cache = require('../services/cache');
const { query } = require('../services/db');
const logger = require('../utils/logger');

const router = express.Router();
const NEWS_CACHE_KEY = 'news_all';
const NEWS_CACHE_TTL = 300; // seconds

router.get('/news', async (req, res) => {
  try {
    const cached = await cache.get(NEWS_CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    const rows = await query(
      'SELECT title, content, created_at FROM blog_posts ORDER BY created_at DESC',
    );

    await cache.set(NEWS_CACHE_KEY, rows, NEWS_CACHE_TTL);
    return res.json(rows);
  } catch (err) {
    logger.error('route/news', 'Failed to load news', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
