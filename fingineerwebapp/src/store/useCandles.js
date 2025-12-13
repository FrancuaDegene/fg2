import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import config from '../config/api';
import { TF_SECONDS } from '../components/Results/Chart/utils/chartTimeUtils';
import { resolveCountBackByTimeframe } from '../utils/chart/timeframes';
import { useChart } from '../components/Results/Chart/ChartContext';

/**
 * useCandles — хук загрузки свечей с клиентским LOD/децимацией и latest-wins.
 * Транспорт: REST (/api/candles-v2). Логика rAF/stride остаётся прежней.
 */

const ORDERED = ['1m', '5m', '15m', '1h', '1d'];
const INTERVAL_SEC = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 10 лет как fallback для Infinity
const ALL_FALLBACK_SEC = 315360000;

const getTimeframeSeconds = (timeframe) => {
  const key = String(timeframe);
  const raw = TF_SECONDS[key];

  if (Number.isFinite(raw)) return raw;
  if (raw === Infinity) return ALL_FALLBACK_SEC;

  const sixMonth = TF_SECONDS['6mth'];
  if (Number.isFinite(sixMonth)) return sixMonth;

  return ALL_FALLBACK_SEC;
};

// авто-подбор интервала под ширину/DPR
function pickAutoInterval(timeframe, userInterval, width, dpr) {
  const tfSec = getTimeframeSeconds(timeframe);
  const pxPerBar = 2.0;
  const targetBars = clamp(Math.round((Number(width) * Number(dpr)) / pxPerBar), 800, 4000);
  const startIdx = Math.max(0, ORDERED.indexOf(String(userInterval)));
  for (let i = startIdx; i < ORDERED.length; i += 1) {
    const id = ORDERED[i];
    if (tfSec / INTERVAL_SEC[id] <= targetBars * 1.3) return id;
  }
  return '1d';
}

export function useCandles({
  socket, // оставлен для совместимости, но не используется
  ticker,
  timeframe,
  interval,
  selectedDate,
  width,
  dpr,
  resolution = 'auto',
  strict = false,
  enabled = true,
}) {
  const chartCtx = useChart?.();
  const tfFromContext = chartCtx?.effectiveTimeframe ?? chartCtx?.currentTimeframe ?? timeframe;
  const intervalFromContext = chartCtx?.currentInterval ?? interval;
  const tfForRequest = tfFromContext ?? timeframe;

  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);

  const metaRef = useRef(null);
  const candlesRef = useRef([]);
  const requestIdRef = useRef(0);
  const lastSeenIdRef = useRef(-1); // latest-wins
  const debounceRef = useRef(null);
  const lastSignatureRef = useRef('');
  const lastRenderRef = useRef({ len: 0, lastTime: null });
  const bufferRef = useRef(null);
  const rafRef = useRef(0);
  const lastFlushTsRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  // сигнатура запроса (для latest-wins)
  const signature = useMemo(() => {
    const w = Number.isFinite(width) ? width : 900;
    const d = Number.isFinite(dpr) ? dpr : 1;
    return JSON.stringify({
      ticker,
      timeframe: tfFromContext,
      interval: intervalFromContext,
      selectedDate,
      width: w,
      dpr: d,
      resolution,
      strict,
    });
  }, [ticker, tfFromContext, intervalFromContext, selectedDate, width, dpr, resolution, strict]);

  // авто-LOD
  const effectiveInterval = useMemo(() => {
    const w = Number.isFinite(width) ? width : 900;
    const d = Number.isFinite(dpr) ? dpr : 1;
    const baseInterval = intervalFromContext;
    const baseTf = tfFromContext;
    if (resolution !== 'auto' || strict) return baseInterval;
    try {
      return pickAutoInterval(baseTf, baseInterval, w, d) || baseInterval;
    } catch {
      return baseInterval;
    }
  }, [resolution, strict, tfFromContext, intervalFromContext, width, dpr]);

  const decimateCandles = useCallback((list = []) => {
  const w = Number.isFinite(width) ? width : 900;
  const d = Number.isFinite(dpr) ? dpr : 1;

  // целевое количество точек на экране
  const rawTarget = Math.round((w * d) / 2);
  const pointsWanted = clamp(rawTarget, 800, 2000); // 👈 теперь ИСПОЛЬЗУЕМ

  const step =
    list.length > pointsWanted
      ? Math.ceil(list.length / pointsWanted)
      : 1;

  const decimated =
    step > 1 ? list.filter((_, i) => (i % step) === 0) : list;

  return { decimated, didDecimate: step > 1 };
}, [width, dpr]);


  const handlePayload = useCallback((payload = {}) => {
    // latest-wins по requestId / signature
    if (typeof payload.requestId === 'number') {
      if (payload.requestId < lastSeenIdRef.current) return;
      lastSeenIdRef.current = payload.requestId;
    } else if (payload.params?.signature && payload.params.signature !== lastSignatureRef.current) {
      return;
    }

    const list = Array.isArray(payload.candles) ? payload.candles : [];
    // stride/децимация — используем общий helper
    const { decimated, didDecimate } = decimateCandles(list);
    bufferRef.current = decimated;

    const flushNow = () => {
      const out = bufferRef.current || decimated;
      bufferRef.current = null;
      const newLen = out.length;
      const newLastTime = newLen ? (out[newLen - 1]?.time ?? null) : null;
      if (lastRenderRef.current.len === newLen && lastRenderRef.current.lastTime === newLastTime) {
        setLoading(false);
        rafRef.current = 0;
        return;
      }
      lastRenderRef.current = { len: newLen, lastTime: newLastTime };

      const m = payload.meta || {};
      startTransition(() => {
        setCandles(out);
        candlesRef.current = out;
        setMeta((prevMeta) => {
          const prevTo = prevMeta?.to;
          const incomingTo = m.to;
          let mergedTo = incomingTo ?? prevTo ?? null;
          if (Number.isFinite(incomingTo) && Number.isFinite(prevTo)) {
            mergedTo = Math.max(incomingTo, prevTo);
          }

          const nextMeta = {
            dataResolution: m.dataResolution ?? (resolution ?? 'auto'),
            sourceInterval: m.sourceInterval ?? m.interval ?? effectiveInterval ?? null,
            isDownsampled: Boolean(
              m.downsampled ??
              m.isDownsampled ??
              ((effectiveInterval && effectiveInterval !== intervalFromContext) || didDecimate)
            ),
            points: Number.isFinite(m.points) ? m.points : decimated.length,
            from: m.from ?? prevMeta?.from ?? null,
            to: mergedTo,
            nextTime: m.nextTime ?? null,
            noData: Boolean(m.noData ?? false),
          };
          metaRef.current = nextMeta;
          return nextMeta;
        });
        setLoading(false);
      });

      rafRef.current = 0;
      lastFlushTsRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    };

    const nowTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!lastFlushTsRef.current || nowTs - lastFlushTsRef.current > 100) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(flushNow);
    } else if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushNow);
    }
  }, [decimateCandles, resolution, effectiveInterval, intervalFromContext]);

  const loadMoreHistory = useCallback(async () => {
    // load older candles using meta.nextTime from backend
    if (isLoadingMoreRef.current) return;
    const metaSnapshot = metaRef.current;
    const currentCandles = candlesRef.current;
    if (!metaSnapshot || !Array.isArray(currentCandles) || currentCandles.length === 0) return;

    const to = metaSnapshot.nextTime;
    if (!Number.isFinite(to)) return;

    const w = Number.isFinite(width) ? width : 900;
    const intervalUsed =
      resolution === 'auto' && !strict ? effectiveInterval || intervalFromContext : intervalFromContext;

    if (!ticker || !intervalUsed) return;

    const countBack = resolveCountBackByTimeframe(tfForRequest, intervalUsed, w);
    const baseUrl = config.API_BASE_URL || '';
    const path = config.ENDPOINTS?.CANDLES_V2 || '/api/candles-v2';
    const url = new URL(path, baseUrl);

    url.searchParams.set('ticker', String(ticker).trim().toUpperCase());
    url.searchParams.set('interval', intervalUsed);
    url.searchParams.set('countBack', String(countBack));
    url.searchParams.set('to', String(to));

    isLoadingMoreRef.current = true;

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[FG][CANDLES_V2_REQ][loadMore]', {
        ticker,
        timeframe: tfForRequest,
        interval: intervalUsed,
        countBack,
        to,
      });
    }

    try {
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const payload = await res.json();
      const list = Array.isArray(payload?.candles) ? payload.candles : [];
      const m = payload?.meta || {};
      const prevMeta = metaRef.current;

      // если данных нет, но meta обновилась — просто обновляем meta и выходим
      if (!list.length) {
        const nextMeta = {
          ...(prevMeta || {}),
          dataResolution: m.dataResolution ?? prevMeta?.dataResolution ?? (resolution ?? 'auto'),
          sourceInterval: m.sourceInterval ?? m.interval ?? prevMeta?.sourceInterval ?? intervalUsed ?? null,
          isDownsampled: Boolean(
            m.downsampled ??
            m.isDownsampled ??
            prevMeta?.isDownsampled ??
            (effectiveInterval && effectiveInterval !== intervalFromContext)
          ),
          points: Number.isFinite(m.points) ? m.points : prevMeta?.points ?? null,
          from: m.from ?? prevMeta?.from ?? null,
          to: Math.max(prevMeta?.to ?? 0, m.to ?? 0) || prevMeta?.to || m.to || null,
          nextTime: m.nextTime ?? prevMeta?.nextTime ?? null,
          noData: Boolean(m.noData ?? prevMeta?.noData ?? false),
        };
        metaRef.current = nextMeta;
        setMeta(nextMeta);
        return;
      }

      let older = list;
      const firstCurrentTime = currentCandles[0]?.time;
      if (older.length && firstCurrentTime != null && older[older.length - 1]?.time === firstCurrentTime) {
        older = older.slice(0, -1);
      }

      const merged = [...older, ...currentCandles];
      const { decimated, didDecimate } = decimateCandles(merged);

      const nextMeta = {
        ...(prevMeta || {}),
        dataResolution: m.dataResolution ?? prevMeta?.dataResolution ?? (resolution ?? 'auto'),
        sourceInterval: m.sourceInterval ?? m.interval ?? prevMeta?.sourceInterval ?? intervalUsed ?? null,
        isDownsampled: Boolean(
          m.downsampled ??
          m.isDownsampled ??
          prevMeta?.isDownsampled ??
          ((effectiveInterval && effectiveInterval !== intervalFromContext) || didDecimate)
        ),
        points: Number.isFinite(m.points) ? m.points : decimated.length,
        from: m.from ?? prevMeta?.from ?? null,
        to: Math.max(prevMeta?.to ?? 0, m.to ?? 0) || prevMeta?.to || m.to || null,
        nextTime: m.nextTime ?? prevMeta?.nextTime ?? null,
        noData: Boolean(m.noData ?? prevMeta?.noData ?? false),
      };

      startTransition(() => {
        setCandles(decimated);
        candlesRef.current = decimated;
        setMeta(nextMeta);
        metaRef.current = nextMeta;
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[FG][CANDLES_V2_LOAD_MORE_ERR]', err);
      }
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [
    width,
    resolution,
    strict,
    effectiveInterval,
    intervalFromContext,
    ticker,
    tfForRequest,
    decimateCandles,
  ]);


  // валидация входа / cleanup rAF
  useEffect(() => {
    if (!enabled) return undefined;
    if (!ticker || !tfFromContext || !intervalFromContext || !selectedDate) {
      setCandles([]);
      setMeta(null);
      candlesRef.current = [];
      metaRef.current = null;
      setLoading(false);
      return undefined;
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [enabled, ticker, tfFromContext, intervalFromContext, selectedDate]);

  // REST-запрос (debounce 100ms) с intervalUsed + pointsWanted
  useEffect(() => {
    if (!enabled) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setLoading(true);
    const controller = new AbortController();
    debounceRef.current = setTimeout(() => {
      const w = Number.isFinite(width) ? width : 900;
      const d = Number.isFinite(dpr) ? dpr : 1;
      const requestId = ++requestIdRef.current;
      lastSignatureRef.current = signature;

      const intervalUsed =
        resolution === 'auto' && !strict ? effectiveInterval || intervalFromContext : intervalFromContext;
      const countBack = resolveCountBackByTimeframe(tfForRequest, intervalUsed, w);

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[FG][CANDLES_V2_REQ]', {
          ticker,
          timeframe: tfForRequest,
          selectedDate,
          userInterval: intervalFromContext,
          intervalUsed,
          width: w,
          dpr: d,
          resolution,
          strict,
        });
      }

      const baseUrl = config.API_BASE_URL || '';
      const path = config.ENDPOINTS?.CANDLES_V2 || '/api/candles-v2';
      const url = new URL(path, baseUrl);

      url.searchParams.set('ticker', String(ticker).trim().toUpperCase());
      url.searchParams.set('interval', intervalUsed);
      url.searchParams.set('countBack', String(countBack));

      fetch(url.toString(), { signal: controller.signal, cache: 'no-store' })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((payload) => {
          handlePayload({
            ...(payload || {}),
            requestId,
            params: {
              ...(payload && payload.params ? payload.params : {}),
              signature,
            },
          });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (process.env.NODE_ENV !== 'production') {
            console.error('[FG][CANDLES_V2_ERR]', err);
          }
          setLoading(false);
        });
    }, 100);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [
    signature,
    enabled,
    effectiveInterval,
    intervalFromContext,
    resolution,
    strict,
    width,
    dpr,
    ticker,
    tfForRequest,
    selectedDate,
    handlePayload,
  ]);

  return { candles, loading, meta, loadMoreHistory };
}
