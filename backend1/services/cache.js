const redis = require('redis');
const config = require('../config/env');
const logger = require('../utils/logger');

const client = redis.createClient({
  url: config.redis.url,
});

client.on('connect', () => logger.info('cache', 'Redis connected'));
client.on('reconnecting', () => logger.warn('cache', 'Redis reconnecting'));
client.on('error', (err) => logger.error('cache', 'Redis error', err));

const connectPromise = client.connect().catch((err) => {
  logger.error('cache', 'Redis connection failed', err);
});

async function ensureConnected() {
  await connectPromise;
}

async function get(key) {
  try {
    await ensureConnected();
    if (!client.isReady) {
      return null;
    }
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.error('cache', `Failed to read key "${key}"`, err);
    return null;
  }
}

async function set(key, value, ttlSec = config.cache.ttlSec) {
  try {
    await ensureConnected();
    if (!client.isReady) {
      return;
    }
    const payload = JSON.stringify(value);
    if (ttlSec > 0) {
      await client.setEx(key, ttlSec, payload);
    } else {
      await client.set(key, payload);
    }
  } catch (err) {
    logger.error('cache', `Failed to write key "${key}"`, err);
  }
}

async function quit() {
  try {
    if (client.isOpen || client.isReady) {
      await client.quit();
      logger.info('cache', 'Redis connection closed');
    }
  } catch (err) {
    logger.error('cache', 'Failed to close Redis connection', err);
  }
}

module.exports = {
  client,
  get,
  set,
  quit,
};
