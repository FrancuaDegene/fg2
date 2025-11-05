import { useEffect, useState } from 'react';

/**
 * Подписка на поток свечей через Socket.IO.
 * @param {object} options
 * @param {import('socket.io-client').Socket} options.socket - активное socket.io соединение
 * @param {string} options.ticker
 * @param {string} options.timeframe
 * @param {string} options.interval
 * @param {string} options.selectedDate
 */
export function useCandles({
  socket,
  ticker,
  timeframe,
  interval,
  selectedDate,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) {
      console.warn('[useCandles] socket is not provided');
      setLoading(false);
      return undefined;
    }
    if (!ticker || !timeframe || !interval || !selectedDate) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setData([]);

    socket.emit('requestChartData', {
      ticker,
      timeframe,
      interval,
      selectedDate,
    });

    const handleInitial = (payload = {}) => {
      if (Array.isArray(payload.candles)) {
        setData(payload.candles);
      }
      setLoading(false);
    };

    const handleUpdate = (payload = {}) => {
      if (!Array.isArray(payload.candles) || payload.candles.length === 0) {
        return;
      }
      setData((prev) => {
        if (!prev.length) return payload.candles;
        return [...prev, ...payload.candles];
      });
    };

    const handleError = () => {
      setLoading(false);
    };

    socket.on('initialData', handleInitial);
    socket.on('updateData', handleUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('initialData', handleInitial);
      socket.off('updateData', handleUpdate);
      socket.off('error', handleError);
    };
  }, [socket, ticker, timeframe, interval, selectedDate]);

  return { data, loading };
}

