const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');

const client = new Redis(config.redis.url);

client.on('connect', () => logger.info('cache', 'Redis подключён'));
client.on('error', (err) => logger.error('cache', 'Ошибка Redis', err));
client.on('reconnecting', () => logger.warn('cache', 'Redis переподключается'));

async function get(key) {
  try {
    if (client.status !== 'ready') {
      return null;
    }
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.error('cache', `Не удалось прочитать ключ ${key}`, err);
    return null;
  }
}

async function set(key, value, ttl = config.cache.ttlSec) {
  try {
    if (client.status !== 'ready') {
      return;
    }
    const payload = JSON.stringify(value);
    if (ttl > 0) {
      await client.set(key, payload, 'EX', ttl);
    } else {
      await client.set(key, payload);
    }
  } catch (err) {
    logger.error('cache', `Не удалось записать ключ ${key}`, err);
  }
}

async function quit() {
  try {
    if (client.status !== 'end') {
      await client.quit();
      logger.info('cache', 'Redis соединение закрыто');
    }
  } catch (err) {
    logger.error('cache', 'Ошибка при закрытии Redis', err);
  }
}

module.exports = {
  client,
  get,
  set,
  quit,
};
