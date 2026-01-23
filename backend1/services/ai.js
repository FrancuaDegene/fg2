const OpenAI = require('openai');
const config = require('../config/env');
const logger = require('../utils/logger');

let client = null;

if (config.openAi.apiKey) {
  client = new OpenAI({
    apiKey: config.openAi.apiKey,
  });
  logger.info('ai', `OpenAI client initialised with model ${config.openAi.model}`);
} else if (config.openAi.mock) {
  logger.warn('ai', 'OPENAI_API_KEY not provided. Running in mock mode via OPENAI_MOCK.');
} else {
  logger.warn('ai', 'OPENAI_API_KEY not provided. Set OPENAI_MOCK=1 to enable mock responses.');
}

function getClient() {
  if (!client) {
    throw new Error('OpenAI client is not configured. Please set OPENAI_API_KEY or enable OPENAI_MOCK.');
  }
  return client;
}

function hasKey() {
  return Boolean(config.openAi.apiKey);
}

function isMock() {
  return config.openAi.mock || !client;
}

function getModel() {
  return config.openAi.model;
}

module.exports = {
  getClient,
  hasKey,
  isMock,
  getModel,
};
