const express = require('express');
const cache = require('../services/cache');
const { getNews } = require('../services/db');
const logger = require('../utils/logger');

const router = express.Router();
const CACHE_KEY = 'news_all';

router.get('/news', async (req, res, next) => {
  try {
    const cached = await cache.get(CACHE_KEY);
    if (cached) {
      logger.debug('route/news', 'возвращаем данные из кеша');
      return res.json(cached);
    }

    const news = await getNews();
    await cache.set(CACHE_KEY, news);
    logger.debug('route/news', 'возвращаем данные из базы, кеш обновлён');
    return res.json(news);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
