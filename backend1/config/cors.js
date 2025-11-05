const cors = require('cors');
const config = require('./env');
const logger = require('../utils/logger');

const allowedOriginsSet = new Set(config.cors.allowedOrigins);

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

    logger.warn('cors', `Blocked request from untrusted origin: ${origin}`);
    return callback(new Error(`CORS: Origin ${origin} is not allowed`));
  },
  credentials: true,
});

module.exports = {
  corsMiddleware,
  allowedOrigins: Array.from(allowedOriginsSet),
};
