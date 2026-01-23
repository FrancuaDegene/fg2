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
        logger.debug('cors', 'Allowing request without Origin header in development mode');
        return callback(null, true);
      }
      return callback(new Error('CORS: Origin header is required'));
    }

    if (allowedOriginsSet.has(origin)) {
      return callback(null, true);
    }

    if (config.isDevelopment && isLocalDevOrigin(origin)) {
      logger.debug('cors', `Allowing local dev origin ${origin}`);
      return callback(null, true);
    }

    logger.warn('cors', `Blocked request from untrusted origin: ${origin}`);
    return callback(new Error(`CORS: Origin ${origin} is not allowed`));
  },
  credentials: true,
});

module.exports = {
  corsMiddleware,
  allowedOrigins: Array.from(allowedOriginsSet),
  isLocalDevOrigin,
};
