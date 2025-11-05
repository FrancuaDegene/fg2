const { getAggregatedCandles } = require('../services/db');
const logger = require('../utils/logger');
const {
  formatDateLocal,
  intervalToMs,
  makeMockBars,
  candlesToBars,
} = require('../utils/candles');

module.exports = function registerCandlesSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`socket ${socket.id}`, 'connected');

    let refreshTimer = null;
    let lastTimestamp = null;

    const clearRefreshTimer = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };

    const loadCandles = async ({ ticker, interval, from, to, range }) => {
      try {
        const candles = await getAggregatedCandles(ticker, interval, from, to);

        if (!Array.isArray(candles) || candles.length === 0) {
          logger.warn(`socket ${socket.id}`, 'No data from DB, fallback to mock', { ticker, interval });
          return candlesToBars(makeMockBars({ start: range.start, end: range.end, interval }));
        }

        const normalized = candlesToBars(candles);
        if (!normalized.length) {
          logger.warn(`socket ${socket.id}`, 'Normalized candles empty, fallback to mock', { ticker, interval });
          return candlesToBars(makeMockBars({ start: range.start, end: range.end, interval }));
        }

        return normalized;
      } catch (err) {
        logger.error(`socket ${socket.id}`, 'getAggregatedCandles failed, fallback to mock', err);
        return candlesToBars(makeMockBars({ start: range.start, end: range.end, interval }));
      }
    };

    socket.on('requestChartData', async ({ ticker, timeframe, interval, selectedDate }) => {
      if (!ticker || !interval || !timeframe || !selectedDate) {
        return socket.emit('error', { message: 'Некорректные параметры запроса графика' });
      }

      clearRefreshTimer();

      const end = new Date(`${selectedDate}T23:59:59+03:00`);
      const start = new Date(end);

      switch (timeframe) {
        case '5d':
          start.setDate(end.getDate() - 4);
          break;
        case '1mth':
          start.setMonth(end.getMonth() - 1);
          break;
        case '3mth':
          start.setMonth(end.getMonth() - 3);
          break;
        case '6mth':
          start.setMonth(end.getMonth() - 6);
          break;
        case '1y':
          start.setFullYear(end.getFullYear() - 1);
          break;
        case 'all':
          start.setFullYear(2000);
          break;
        default:
          start.setHours(6, 50, 0, 0);
          end.setHours(23, 50, 0, 0);
      }

      try {
        const range = {
          start: new Date(start.getTime()),
          end: new Date(end.getTime()),
        };
        const from = formatDateLocal(range.start);
        const to = formatDateLocal(range.end);

        const context = { ticker, interval, from, to, range };
        const candles = await loadCandles(context);

        socket.emit('initialData', { ticker, candles });
        lastTimestamp = candles.length ? candles[candles.length - 1].time : null;

        const refreshMs = Math.max(15000, intervalToMs(interval) || 60000);
        refreshTimer = setInterval(async () => {
          try {
            const nextCandles = await loadCandles(context);
            if (!nextCandles.length) return;

            const nextLast = nextCandles[nextCandles.length - 1].time;
            if (lastTimestamp !== null && nextLast === lastTimestamp) {
              return;
            }

            lastTimestamp = nextLast;
            socket.emit('updateData', { ticker, candles: nextCandles });
          } catch (err) {
            logger.error(`socket ${socket.id}`, 'updateData error', err);
          }
        }, refreshMs);
      } catch (err) {
        logger.error(`socket ${socket.id}`, 'requestChartData error', err);
        socket.emit('error', { message: 'Не удалось получить данные графика' });
      }

      return undefined;
    });

    socket.on('disconnect', () => {
      clearRefreshTimer();
      logger.info(`socket ${socket.id}`, 'disconnected');
    });
  });
};
