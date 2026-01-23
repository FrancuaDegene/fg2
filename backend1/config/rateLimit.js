const rateLimit = require('express-rate-limit');
const config = require('./env');

const baseOptions = {
  windowMs: config.rateLimit.windowMs,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
  },
  keyGenerator: (req) => req.ip,
};

const readLimiter = rateLimit({
  ...baseOptions,
  max: config.rateLimit.max,
});

const chatLimiter = rateLimit({
  ...baseOptions,
  max: config.rateLimit.chatMax,
});

module.exports = {
  readLimiter,
  chatLimiter,
};
