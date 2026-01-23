const cors = require('cors');
const config = require('./env');
const logger = require('../utils/logger');

const allowedOriginsSet = new Set(config.cors.allowedOrigins);

const isLocalDevOrigin = (origin) => {
  if (!origin) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      if (config.isDevelopment) {
        logger.debug('cors', 'Разрешён запрос без Origin (dev)');
        return callback(null, true);
      }
      return callback(new Error('CORS: отсутствует заголовок Origin'));
    }

    if (allowedOriginsSet.has(origin)) {
      return callback(null, true);
    }

    if (config.isDevelopment && isLocalDevOrigin(origin)) {
      logger.debug('cors', `Разрешён локальный origin ${origin}`);
      return callback(null, true);
    }

    logger.warn('cors', `Запрос с недоверенного origin: ${origin}`);
    return callback(new Error(`CORS: Origin ${origin} запрещён`));
  },
  credentials: true,
  optionsSuccessStatus: 204,
});

module.exports = {
  corsMiddleware,
  allowedOrigins: Array.from(allowedOriginsSet),
  isLocalDevOrigin,
};
