const express = require('express');
const { getSuggestions } = require('../services/db');
const { sanitizeQuery } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/suggestions/:query', async (req, res, next) => {
  try {
    const query = sanitizeQuery(req.params.query);
    const suggestions = await getSuggestions(query);
    logger.debug('route/suggestions', `query="${query}" results=${suggestions.length}`);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
