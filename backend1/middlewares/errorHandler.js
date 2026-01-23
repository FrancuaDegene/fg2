const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('http', 'Unhandled error', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Ошибка сервера' });
};
