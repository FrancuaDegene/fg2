const { getAggregatedCandles, getLastCandleTime, getFirstCandleTime } = require('./db');
const { candlesToBars } = require('../utils/candles');
const logger = require('../utils/logger');

const LIMITS = {
  MAX_BARS_PER_REQUEST: 5000,     // v2 limit per request
  MAX_BARS_PER_WINDOW: 80000,     // client window cap
  MAX_BARS_PER_PRESET: 300000,    // legacy/preset cap
  MAX_RANGE_SEC: 60 * 60 * 24 * 370, // ~1y range cap for v2
};

const INTERVAL_SECONDS = {
  '1m': 60,
  '5m': 5 * 60,
  '15m': 15 * 60,
  '1h': 60 * 60,
  '4h': 4 * 60 * 60,
  '1d': 24 * 60 * 60,
};

class CandlesV2Error extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CandlesV2Error';
    this.statusCode = statusCode;
  }
}

function normalizeQuery(rawQuery) {
  const ticker = (rawQuery?.ticker || '').toString().trim();
  if (!ticker) {
    throw new CandlesV2Error('Parameter "ticker" is required', 400);
  }
  const normalizedTicker = ticker.toUpperCase();

  const interval = (rawQuery?.interval || '').toString().trim();
  if (!interval || !Object.prototype.hasOwnProperty.call(INTERVAL_SECONDS, interval)) {
    const allowed = Object.keys(INTERVAL_SECONDS).join(', ');
    throw new CandlesV2Error(`Parameter "interval" must be one of: ${allowed}`, 400);
  }

  const parseOptionalInt = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new CandlesV2Error('Failed to parse numeric parameter', 400);
    }
    return parsed;
  };

  const fromSec = parseOptionalInt(rawQuery?.from);
  const toSec = parseOptionalInt(rawQuery?.to);
  const countBackRaw = parseOptionalInt(rawQuery?.countBack);

  if (countBackRaw !== null && countBackRaw <= 0) {
    throw new CandlesV2Error('Parameter "countBack" must be > 0', 400);
  }

  return {
    ticker: normalizedTicker,
    interval,
    fromSec,
    toSec,
    countBack: countBackRaw,
  };
}

function clampCountBack(requested) {
  if (requested === null || requested === undefined) return null;
  const max = Math.min(
    LIMITS.MAX_BARS_PER_REQUEST,
    LIMITS.MAX_BARS_PER_WINDOW,
    LIMITS.MAX_BARS_PER_PRESET,
  );
  return Math.min(requested, max);
}

async function getCandlesV2(rawQuery) {
  const {
    ticker,
    interval,
    fromSec,
    toSec,
    countBack,
  } = normalizeQuery(rawQuery);

  const intervalSec = INTERVAL_SECONDS[interval];
  const nowSec = Math.floor(Date.now() / 1000);
  const lastTimeSec = await getLastCandleTime(ticker);

  let effectiveCountBack = clampCountBack(countBack);
  const DEFAULT_FALLBACK_COUNT = 2000;
  if (!effectiveCountBack) {
    effectiveCountBack = Math.min(
      DEFAULT_FALLBACK_COUNT,
      LIMITS.MAX_BARS_PER_REQUEST,
      LIMITS.MAX_BARS_PER_WINDOW,
    );
  }

  const hasFrom = fromSec !== null;
  const hasTo = toSec !== null;
  const hasCountBack = !!countBack;

  let rangeFromSec = null;
  let rangeToSec = null;
  const baseToSec = hasTo ? toSec : (lastTimeSec || nowSec);

  if (hasCountBack) {
    rangeToSec = baseToSec;
    const approxRangeSec = Math.min(
      LIMITS.MAX_RANGE_SEC,
      intervalSec * effectiveCountBack * 3,
    );
    rangeFromSec = Math.max(rangeToSec - approxRangeSec, 0);
  } else if (hasFrom && hasTo) {
    if (fromSec >= toSec) {
      throw new CandlesV2Error('"from" must be less than "to"', 400);
    }
    rangeFromSec = fromSec;
    rangeToSec = toSec;
  } else if (!hasFrom && hasTo) {
    rangeToSec = baseToSec;
    rangeFromSec = Math.max(rangeToSec - LIMITS.MAX_RANGE_SEC, 0);
  } else {
    rangeToSec = baseToSec;
    const approxRangeSec = Math.min(
      LIMITS.MAX_RANGE_SEC,
      intervalSec * effectiveCountBack * 3,
    );
    rangeFromSec = Math.max(rangeToSec - approxRangeSec, 0);
  }

  if ((rangeToSec - rangeFromSec) > LIMITS.MAX_RANGE_SEC * 3) {
    throw new CandlesV2Error('Requested time range is too large', 400);
  }

  logger.debug('candles-v2', 'range', {
    ticker,
    interval,
    fromSec: rangeFromSec,
    toSec: rangeToSec,
    effectiveCountBack,
    mode: { hasFrom, hasTo, hasCountBack },
  });

  const fromDate = new Date(rangeFromSec * 1000);
  const toDate = new Date(rangeToSec * 1000);

  let rawCandles = await getAggregatedCandles(
    ticker,
    interval,
    fromDate,
    toDate,
  );
  if (!Array.isArray(rawCandles)) {
    rawCandles = [];
  }

  const bars = candlesToBars(rawCandles || []);

  const noData = !bars || bars.length === 0;
  if (noData) {
    return {
      candles: [],
      meta: {
        from: null,
        to: null,
        noData: true,
        nextTime: null,
      },
    };
  }

  let candles = bars;

  if (effectiveCountBack && candles.length > effectiveCountBack) {
    candles = candles.slice(candles.length - effectiveCountBack);
  }

  if (candles.length > LIMITS.MAX_BARS_PER_REQUEST) {
    candles = candles.slice(candles.length - LIMITS.MAX_BARS_PER_REQUEST);
  }

  const earliest = candles[0]?.time ?? null;
  const latest = candles[candles.length - 1]?.time ?? null;

  let nextTime = null;
  const firstAvailableSec = await getFirstCandleTime(ticker);
  if (firstAvailableSec != null && earliest != null) {
    const candidate = earliest - intervalSec;
    if (candidate >= firstAvailableSec) {
      nextTime = candidate;
    }
  }

  return {
    candles,
    meta: {
      from: earliest,
      to: latest,
      noData: false,
      nextTime,
    },
  };
}

module.exports = {
  getCandlesV2,
  CandlesV2Error,
  LIMITS,
  INTERVAL_SECONDS,
};

/**
 * TEST ideas (manual):
 * - getCandlesV2({ ticker: 'SBER', interval: '1m', countBack: '100' })
 *   should return <= 100 bars, meta.to equals last bar time, noData reflects presence.
 * - invalid interval -> throws CandlesV2Error with statusCode 400.
 * - from >= to -> throws CandlesV2Error 400.
 */
