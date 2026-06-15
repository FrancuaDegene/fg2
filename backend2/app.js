const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');

const config = require('./config/env');
const { corsMiddleware, allowedOrigins } = require('./config/cors');
const { readLimiter } = require('./config/rateLimit');
const suggestionsRoutes = require('./routes/suggestions');
const instrumentsRoutes = require('./routes/instruments');
const tickerRoutes = require('./routes/ticker');
const newsRoutes = require('./routes/news');
const dividendsRoutes = require('./routes/dividends');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const cache = require('./services/cache');
const { closePool } = require('./services/db');

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
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

app.use('/api', readLimiter);
app.use('/api', suggestionsRoutes);
app.use('/api', instrumentsRoutes);
app.use('/api', tickerRoutes);
app.use('/api', newsRoutes);
app.use('/api', dividendsRoutes);

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'));
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

app.use(errorHandler);

logger.info('server', `Environment: ${config.nodeEnv}`);
logger.info('server', `Allowed origins: ${allowedOrigins.join(', ')}`);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error('server', `Порт ${config.port} уже используется`);
  } else {
    logger.error('server', 'Неожиданная ошибка сервера', err);
  }
  process.exit(1);
});

server.listen(config.port, () => {
  logger.info('server', `HTTP сервер запущен на порту ${config.port}`);
});

async function shutdown(signal) {
  logger.warn('server', `${signal} получен. Завершаем работу...`);

  try {
    await new Promise((resolve) => server.close(resolve));
    logger.info('server', 'HTTP сервер остановлен');
  } catch (err) {
    logger.error('server', 'Ошибка при остановке HTTP сервера', err);
  }

  await Promise.allSettled([
    cache.quit(),
    closePool(),
  ]);

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
  logger.error('server', 'Unhandled promise rejection', err);
});
process.on('uncaughtException', (err) => {
  logger.error('server', 'Uncaught exception', err);
  process.exit(1);
});
