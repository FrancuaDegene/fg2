const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config({ path: process.env.BACKEND2_ENV || path.resolve(__dirname, '..', '.env') });

const requiredDbEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbEnv = requiredDbEnv.filter((key) => !process.env[key]);

if (missingDbEnv.length) {
  throw new Error(`[config] Отсутствуют переменные окружения для БД: ${missingDbEnv.join(', ')}`);
}

const nodeEnv = process.env.NODE_ENV || 'development';

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!allowedOrigins.length) {
  logger.warn('config', 'ALLOWED_ORIGINS пуст, используем значения по умолчанию');
  allowedOrigins.push(...DEFAULT_ALLOWED_ORIGINS);
}

const port = parseNumber(process.env.PORT, 3002);
const dbPort = parseNumber(process.env.DB_PORT, 3306);

if (port === dbPort) {
  logger.warn('config', `PORT (${port}) совпадает с DB_PORT (${dbPort}). Проверь настройки.`);
}

const rateLimitWindowMs = parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
const rateLimitMax = parseNumber(process.env.RATE_LIMIT_MAX, 1000);
const cacheTtlSec = parseNumber(process.env.CACHE_TTL_SEC, 3600);

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv !== 'production',
  port,
  cors: {
    allowedOrigins,
  },
  db: {
    host: process.env.DB_HOST,
    port: dbPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: parseNumber(process.env.DB_CONNECTION_LIMIT, 10),
    connectTimeout: parseNumber(process.env.DB_CONNECT_TIMEOUT_MS, 10_000),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  rateLimit: {
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
  },
  cache: {
    ttlSec: cacheTtlSec,
  },
};
