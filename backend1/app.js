const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const { Server } = require('socket.io');

const config = require('./config/env');
const { corsMiddleware, allowedOrigins } = require('./config/cors');
const { readLimiter, chatLimiter } = require('./config/rateLimit');
const newsRoutes = require('./routes/news');
const tickerRoutes = require('./routes/ticker');
const dividendsRoutes = require('./routes/dividends');
const chatRoutes = require('./routes/chat');
const candlesSocket = require('./sockets/candlesSocket');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const cache = require('./services/cache');
const { closePool } = require('./services/db');
const { hasKey, getModel } = require('./services/ai');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: config.isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false,
}));
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/news', readLimiter);
app.use('/api/dividends', readLimiter);
app.use('/api/ticker', readLimiter);
app.use('/api/chat', chatLimiter);
app.use('/api/chat-stream', chatLimiter);

app.use('/api', tickerRoutes);
app.use('/api', newsRoutes);
app.use('/api', dividendsRoutes);
app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    model: getModel(),
    hasKey: hasKey(),
    time: new Date().toISOString(),
  });
});

app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

candlesSocket(io);

logger.info('server', `Environment: ${config.nodeEnv}`);
logger.info('server', `Allowed origins: ${allowedOrigins.join(', ')}`);
logger.info('server', `OpenAI model: ${getModel()} (has key: ${hasKey()})`);

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    logger.error('server', `Порт ${config.port} уже используется. Завершите другой процесс или установите PORT на свободное значение.`);
  } else {
    logger.error('server', 'Unexpected server error', err);
  }
  process.exit(1);
});

server.listen(config.port, () => {
  logger.info('server', `HTTP server listening on port ${config.port}`);
});

async function shutdown(signal) {
  logger.info('server', `Received ${signal}. Shutting down gracefully...`);

  try {
    await new Promise((resolve) => io.close(() => resolve()));
    logger.info('server', 'Socket.io server closed');
  } catch (err) {
    logger.error('server', 'Error closing Socket.io', err);
  }

  try {
    await new Promise((resolve) => server.close(() => resolve()));
    logger.info('server', 'HTTP server closed');
  } catch (err) {
    logger.error('server', 'Error closing HTTP server', err);
  }

  await Promise.allSettled([
    cache.quit(),
    closePool(),
  ]);

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  logger.error('server', 'Unhandled promise rejection', error);
});
process.on('uncaughtException', (error) => {
  logger.error('server', 'Uncaught exception', error);
});
