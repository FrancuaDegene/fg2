const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('http', err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const message = err.message || 'Ошибка сервера';

  return res.status(status).json({ error: message });
};
