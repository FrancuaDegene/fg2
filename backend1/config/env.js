const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config({ path: process.env.BACKEND1_ENV || path.resolve(__dirname, '..', '.env') });

const requiredDbEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbEnv = requiredDbEnv.filter((key) => !process.env[key]);

if (missingDbEnv.length > 0) {
  throw new Error(`[config] Missing required database environment variables: ${missingDbEnv.join(', ')}`);
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
  logger.warn('config', 'ALLOWED_ORIGINS is empty; falling back to localhost defaults');
  allowedOrigins.push(...DEFAULT_ALLOWED_ORIGINS);
}

const port = parseNumber(process.env.PORT, 3001);
const dbPort = parseNumber(process.env.DB_PORT, 3306);

if (port === dbPort) {
  logger.warn('config', `DB_PORT (${dbPort}) equals application PORT (${port}). Did you swap PORT/DB_PORT in .env?`);
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const rateLimitWindowMs = parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
const rateLimitMax = parseNumber(process.env.RATE_LIMIT_MAX, 1000);
const rateLimitChatMax = parseNumber(process.env.RATE_LIMIT_CHAT_MAX, 60);

const cacheTtlSec = parseNumber(process.env.CACHE_TTL_SEC, 3600);

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const openAiMock = process.env.OPENAI_MOCK === '1' || process.env.OPENAI_MOCK === 'true';
const openAiApiKey = process.env.OPENAI_API_KEY || '';

if (!openAiApiKey && !openAiMock) {
  logger.warn('config', 'OPENAI_API_KEY is not set. Enable OPENAI_MOCK=1 for mock responses.');
}

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv !== 'production',
  port,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: dbPort,
  },
  redis: {
    url: redisUrl,
  },
  cors: {
    allowedOrigins,
  },
  rateLimit: {
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    chatMax: rateLimitChatMax,
  },
  cache: {
    ttlSec: cacheTtlSec,
  },
  openAi: {
    apiKey: openAiApiKey,
    model: openAiModel,
    mock: openAiMock,
  },
};
