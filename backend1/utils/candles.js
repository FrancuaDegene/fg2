function formatDateLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function intervalToMs(interval) {
  const map = { '1m': 60e3, '5m': 300e3, '15m': 900e3, '1h': 3600e3, '1d': 86400e3 };
  return map[interval] ?? 60e3;
}

function toUnixSeconds(t) {
  if (typeof t === 'number') {
    return Math.floor((t > 1e12 ? t : t * 1000) / 1000);
  }
  if (t instanceof Date) {
    return Math.floor(t.getTime() / 1000);
  }
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000);
}

function makeMockBars({ start, end, interval }) {
  const step = intervalToMs(interval);
  const bars = [];
  let t = start.getTime();
  let price = 100 + Math.random() * 10;

  while (t <= end.getTime()) {
    const open = price;
    const high = open * (1 + Math.random() * 0.01);
    const low = open * (1 - Math.random() * 0.01);
    const close = low + Math.random() * (high - low);
    bars.push({
      time: Math.floor(t / 1000),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(100 + Math.random() * 1000),
    });
    price = close * (1 + (Math.random() - 0.5) * 0.01);
    t += step;
  }

  return bars;
}

function candlesToBars(candles = []) {
  return candles.map((candle) => {
    const timeRaw = candle.time ?? candle.timestamp ?? candle.SYSTIME ?? candle.systime ?? candle.date ?? candle.datetime;
    const open = Number(candle.open ?? candle.OPEN ?? candle.o);
    const high = Number(candle.high ?? candle.HIGH ?? candle.h);
    const low = Number(candle.low ?? candle.LOW ?? candle.l);
    const close = Number(candle.close ?? candle.CLOSE ?? candle.c);
    const volume = Number(candle.volume ?? candle.VOLUME ?? candle.v ?? 0);
    return {
      time: toUnixSeconds(timeRaw),
      open,
      high,
      low,
      close,
      volume,
    };
  }).filter((bar) => (
    Number.isFinite(bar.time)
    && Number.isFinite(bar.open)
    && Number.isFinite(bar.high)
    && Number.isFinite(bar.low)
    && Number.isFinite(bar.close)
  ));
}

module.exports = {
  formatDateLocal,
  intervalToMs,
  makeMockBars,
  candlesToBars,
  toUnixSeconds,
};
