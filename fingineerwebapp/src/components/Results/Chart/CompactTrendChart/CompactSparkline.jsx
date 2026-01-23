import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { calcSparklinePoints } from '../../../../utils/calcSparklinePoints';
import './CompactTrendChart.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const pad2 = (value) => String(value).padStart(2, '0');

const formatCompactDate = (timestampSec, currentRange) => {
  if (!Number.isFinite(timestampSec)) return '';
  const d = new Date(timestampSec * 1000);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  const r = String(currentRange || '').trim().toLowerCase();
  const showTime = r === '1d' || r === '5d';
  return showTime ? `${dd}.${mm} ${hh}:${min}` : `${dd}.${mm}`;
};

const formatPrice = (value) => (Number.isFinite(value) ? value.toFixed(2) : '');

const CompactSparkline = ({ chartData, ticker, range, onHoverChange }) => {
  const containerRef = useRef(null);
  const polyRef = useRef(null);
  const headRef = useRef(null);
  const resizeRafRef = useRef(0);
  const animRafRef = useRef(0);
  const warmupRafRef = useRef(0);
  const warmedKeyRef = useRef('');
  const hoverIndexRef = useRef(-1);
  const hoverRafRef = useRef(0);
  const lastHoverClientXRef = useRef(0);
  const lastEmitTsRef = useRef(0);
  const lastRenderedPointsStrRef = useRef('');
  const renderedPointListRef = useRef([]);
  const sizeSettleTimerRef = useRef(0);
  // Prevent 1-frame blank right after animation finish (cleanup/placeholder races).
  const postFinishUntilRef = useRef(0);
  const perfStartRef = useRef(0);
  const animWatchdogRef = useRef(0);
  const seenRef = useRef(new Set());
  const inFlightKeyRef = useRef('');
  const frozenPointsRef = useRef('');
  const frozenSizeRef = useRef({ width: 0, height: 0 });
  const pendingSizeRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const pendingPointsRef = useRef('');
  const renderKeyRef = useRef('');
  const dataSigRef = useRef('');
  const awaitingKeyRef = useRef('');
  const latestPointsRef = useRef('');
  const stableTimerRef = useRef(0);
  const mountedRef = useRef(true);
  const didFinishAnimRef = useRef(false);
  const committedSigRef = useRef('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isStable, setIsStable] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSizeSettled, setIsSizeSettled] = useState(false);
  const [tip, setTip] = useState({ visible: false, label: '', x: 0, y: 0, align: 'right' });

  const prefersReducedMotion = useMemo(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  const sparkPerfEnabled =
    String(
      process.env.REACT_APP_FG_SPARK_PERF ||
      process.env.FG_SPARK_PERF ||
      (typeof window !== 'undefined' ? window.FG_SPARK_PERF : '')
    ) === '1';

  const sparkTempEnabled =
    String(
      process.env.REACT_APP_FG_SPARK_TEMP ||
      process.env.FG_SPARK_TEMP ||
      (typeof window !== 'undefined' ? window.FG_SPARK_TEMP : '')
    ) === '1';

  const { closes, validCandles } = useMemo(() => {
    const candles = Array.isArray(chartData?.candles) ? chartData.candles : [];
    if (candles.length === 0) return { closes: [], validCandles: [] };
    const result = [];
    const valid = [];
    for (const candle of candles) {
      const value = toNumber(candle?.close ?? candle?.value);
      if (value === null) continue;
      result.push(value);
      valid.push(candle);
    }
    return { closes: result, validCandles: valid };
  }, [chartData]);

  // Downsample for performance on large ranges (6m/1y).
  const sampledIndices = useMemo(() => {
    const len = closes.length;
    if (!len) return [];
    const w = Number(size?.width) || 0;
    const maxPoints = Math.max(200, Math.min(len, Math.floor(w * 2)));
    if (w <= 0 || len <= maxPoints) {
      const out = new Array(len);
      for (let i = 0; i < len; i += 1) out[i] = i;
      return out;
    }
    const step = len / maxPoints;
    const out = new Array(maxPoints);
    for (let i = 0; i < maxPoints; i += 1) {
      out[i] = Math.floor(i * step);
    }
    return out;
  }, [closes.length, size?.width]);

  const sampledCloses = useMemo(() => {
    if (!sampledIndices.length) return closes;
    return sampledIndices.map((idx) => closes[idx]);
  }, [sampledIndices, closes]);

  const sampledCandles = useMemo(() => {
    if (!sampledIndices.length) return validCandles;
    return sampledIndices.map((idx) => validCandles[idx]).filter(Boolean);
  }, [sampledIndices, validCandles]);

  const dataSig = useMemo(() => {
    if (!closes.length) return '';
    const first = closes[0];
    const last = closes[closes.length - 1];
    return `${closes.length}|${first}|${last}`;
  }, [closes]);

  useEffect(() => {
    const key = `${String(ticker || '').trim().toUpperCase() || 'na'}|${String(range || '').trim() || 'na'}`;
    const prevKey = awaitingKeyRef.current;
    const keyChanged = prevKey !== key;
    if (keyChanged) {
      awaitingKeyRef.current = key;
      const isFirstMount = !prevKey;
      if (isFirstMount && dataSig) {
        dataSigRef.current = dataSig;
      }
      return;
    }
    if (dataSig && dataSig !== dataSigRef.current) {
      dataSigRef.current = dataSig;
      awaitingKeyRef.current = key;
    }
  }, [ticker, range, dataSig]);

  const { pointsString } = useMemo(() => {
    // Avoid cold-start stutter: don't compute points on transient sizes before settle.
    if (!isSizeSettled || size.width <= 0 || size.height <= 0 || closes.length < 2) {
      return { pointsString: '' };
    }
    return calcSparklinePoints(sampledCloses, size.width, size.height);
  }, [sampledCloses, size.width, size.height, closes.length, isSizeSettled]);

  const logSparkPerf = (event, extra = {}) => {
    if (!sparkPerfEnabled) return;
    const key = `${String(ticker || '').trim().toUpperCase() || 'na'}|${String(range || '').trim() || 'na'}`;
    const payload = {
      event,
      now: Date.now(),
      key,
      isAnimatingRef: isAnimatingRef.current,
      isAnimating,
      isSizeSettled,
      hasFrozenPoints: !!frozenPointsRef.current,
      size: { w: size.width, h: size.height },
      pendingSize: pendingSizeRef.current != null,
      pointsStringLen: pointsString ? pointsString.length : 0,
      ...extra,
    };
    console.log('[FG][sparkPerf]', payload);
  };

  const logSparkTemp = (event, extra = {}) => {
    if (!sparkTempEnabled) return;
    const key = `${String(ticker || '').trim().toUpperCase() || 'na'}|${String(range || '').trim() || 'na'}`;
    console.log('[FG][sparkTemp]', { event, key, ...extra });
  };

  useEffect(() => {
    if (isAnimating) {
      pendingPointsRef.current = pointsString;
      return;
    }
    latestPointsRef.current = pointsString;
    pendingPointsRef.current = '';
  }, [pointsString, isAnimating]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAnimating && pendingSizeRef.current) {
      const pending = pendingSizeRef.current;
      pendingSizeRef.current = null;
      setSize(pending);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (isAnimatingRef.current) return undefined;
    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = 0;
    }
    const shouldShowPlaceholder =
      !isSizeSettled || size.width <= 0 || size.height <= 0 || closes.length < 2 || !pointsString;
    if (shouldShowPlaceholder) {
      setIsStable(false);
      return undefined;
    }
    // If the range was already animated (seen) OR the series is large, skip "stable" delay
    // to avoid an empty-frame blink on repeat switches / big ranges.
    const key = `${String(ticker || '').trim().toUpperCase() || 'na'}|${String(range || '').trim() || 'na'}`;
    const alreadySeenNow = key !== 'na|na' ? seenRef.current.has(key) : false;
    const largeSeries = closes.length > 2000;
    const stableDelay = (alreadySeenNow || largeSeries) ? 0 : 180;

    setIsStable(false);
    if (stableDelay === 0) {
      setIsStable(true);
      return undefined;
    }
    stableTimerRef.current = setTimeout(() => {
      stableTimerRef.current = 0;
      setIsStable(true);
    }, stableDelay);
    return () => {
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = 0;
      }
    };
  }, [pointsString, size.width, size.height, closes.length, ticker, range, isSizeSettled]);

  const tickerKeyRender = String(ticker || '').trim().toUpperCase() || 'na';
  const rangeKeyRender = String(range || '').trim() || 'na';
  const seenKeyRender = `${tickerKeyRender}|${rangeKeyRender}`;
  const currentRangeKey = seenKeyRender;
  const dataRangeKey = String(chartData?.rangeKey || '');
  // Treat missing/empty rangeKey as "awaiting" to avoid showing stale line for a frame.
  const isAwaitingData = dataRangeKey !== currentRangeKey;
  // If we already have frozen geometry, don't blank the line during transient settle=false
  // (common right after animation when pendingSizeRef applies).
  const hasFrozenPoints = !!frozenPointsRef.current;
  const showPlaceholder =
    isAwaitingData ||
    (size.width <= 0 || size.height <= 0) ||
    closes.length < 2 ||
    (!isSizeSettled && !hasFrozenPoints) ||
    (!pointsString && !hasFrozenPoints);
  const effectiveSize = isAnimating ? frozenSizeRef.current : size;
  const viewBoxWidth = effectiveSize.width > 0 ? effectiveSize.width : 1;
  const viewBoxHeight = effectiveSize.height > 0 ? effectiveSize.height : 1;

  useEffect(() => {
    logSparkPerf('showPlaceholder', {
      isAwaitingData,
      notSizeSettled: !isSizeSettled,
      sizeLeZero: size.width <= 0 || size.height <= 0,
      closesLt2: closes.length < 2,
      noPointsString: !pointsString,
      noFrozenPoints: !hasFrozenPoints,
    });
  }, [isAwaitingData, isSizeSettled, size.width, size.height, closes.length, pointsString, hasFrozenPoints]);

  // Double-buffer to avoid one-frame blanking on first load ([] -> data) and other transient states.
  // We only reuse last good points when the current effective size matches, otherwise geometry may be wrong.
  const lastGoodPointsRef = useRef('');
  const lastGoodSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    // Cache only stable, non-empty points.
    if (!isSizeSettled) return;
    if (!pointsString) return;
    if (effectiveSize.width <= 0 || effectiveSize.height <= 0) return;
    lastGoodPointsRef.current = pointsString;
    lastGoodSizeRef.current = { width: effectiveSize.width, height: effectiveSize.height };
  }, [pointsString, isSizeSettled, effectiveSize.width, effectiveSize.height]);

  // Deferred commit of polyline points after finish (never inside finishImmediate).
  useEffect(() => {
    const key = renderKeyRef.current;
    if (!key) return;
    const sig = dataSigRef.current || dataSig || '';
    const commitSig = `${key}|${sig}`;
    if (committedSigRef.current === commitSig) return;
    if (awaitingKeyRef.current !== key) return;
    if (isAnimatingRef.current) return;
    if (!isSizeSettled) return;
    if (showPlaceholder) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now < postFinishUntilRef.current) return;

    const poly = polyRef.current;
    if (!poly) return;
    const latest = pendingPointsRef.current || latestPointsRef.current || pointsString;
    if (!latest) return;
    try {
      poly.setAttribute('points', latest);
      committedSigRef.current = commitSig;
    } catch {}
  }, [pointsString, isSizeSettled, showPlaceholder, tickerKeyRender, rangeKeyRender, dataSig]);

  renderKeyRef.current = seenKeyRender;
  const alreadySeenRender =
    tickerKeyRender !== 'na' ? seenRef.current.has(seenKeyRender) : false;
  const inFlightSameRender = inFlightKeyRef.current === seenKeyRender;
  const largeSeriesRender = closes.length > 2000;
  const shouldAnimate =
    isStable && isSizeSettled && !showPlaceholder && !prefersReducedMotion && !alreadySeenRender && !inFlightSameRender;

  // Single source of truth for points: React prop only.
  // During animation we DO NOT blank points (dashoffset handles the drawing),
  // this avoids end-of-animation "blink" caused by React vs setAttribute races.
  const canUseLastGood =
    isSizeSettled &&
    !!lastGoodPointsRef.current &&
    lastGoodSizeRef.current.width === effectiveSize.width &&
    lastGoodSizeRef.current.height === effectiveSize.height;
  const displayPoints = showPlaceholder
    ? (canUseLastGood ? lastGoodPointsRef.current : '')
    : (frozenPointsRef.current || pointsString);

  const pointList = useMemo(() => {
    if (!displayPoints) return [];
    const pairs = displayPoints.trim().split(' ');
    const out = [];
    for (const pair of pairs) {
      if (!pair) continue;
      const [xStr, yStr] = pair.split(',');
      const x = Number(xStr);
      const y = Number(yStr);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      out.push({ x, y });
    }
    return out;
  }, [displayPoints]);

  const logHoverPerf = (event) => {
    if (!sparkPerfEnabled) return;
    console.log('[FG][sparkPerf][hover]', {
      event,
      now: Date.now(),
      showPlaceholder,
      hasFrozenPoints: !!frozenPointsRef.current,
      pointListLen: pointList.length,
      isAnimatingRef: isAnimatingRef.current,
    });
  };

  const hideTip = useCallback(() => {
    hoverIndexRef.current = -1;
    if (hoverRafRef.current) {
      cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = 0;
    }
    setTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    lastEmitTsRef.current = 0;
    if (typeof onHoverChange === 'function') onHoverChange(null);
  }, [onHoverChange]);

  useEffect(() => {
    return () => {
      if (hoverRafRef.current) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = 0;
      }
    };
  }, []);

  // During "hand-drawn" animation we do not allow hover UI; hide once on start.
  useEffect(() => {
    if (isAnimating) hideTip();
  }, [isAnimating, hideTip]);

  const updateTipAtClientX = useCallback((clientX) => {
    const node = containerRef.current;
    // Gate hover until the "hand-drawn" animation fully completes.
    if (isAnimatingRef.current) return;
    if (!node || showPlaceholder || !sampledCandles.length) {
      logHoverPerf('hideTip');
      hideTip();
      return;
    }
    const polyNode = polyRef.current;
    const renderedPointsStr = polyNode?.getAttribute('points') || '';
    if (renderedPointsStr && renderedPointsStr !== lastRenderedPointsStrRef.current) {
      const pairs = renderedPointsStr.trim().split(' ');
      const out = [];
      for (const pair of pairs) {
        if (!pair) continue;
        const [xStr, yStr] = pair.split(',');
        const x = Number(xStr);
        const y = Number(yStr);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        out.push({ x, y });
      }
      renderedPointListRef.current = out;
      lastRenderedPointsStrRef.current = renderedPointsStr;
    } else if (!renderedPointsStr && lastRenderedPointsStrRef.current) {
      renderedPointListRef.current = [];
      lastRenderedPointsStrRef.current = '';
    }
    let renderedPointList = renderedPointListRef.current;
    if (!renderedPointList.length) renderedPointList = pointList;
    if (!renderedPointList.length) {
      logHoverPerf('hideTip');
      hideTip();
      return;
    }
    const rect = node.getBoundingClientRect();
    const xLocal = clamp(clientX - rect.left, 0, rect.width);
    const firstX = renderedPointList[0]?.x ?? 0;
    const lastX = renderedPointList[renderedPointList.length - 1]?.x ?? rect.width;
    const spanX = Math.max(1, lastX - firstX);
    const ptIdx = clamp(
      Math.round(((xLocal - firstX) / spanX) * (renderedPointList.length - 1)),
      0,
      renderedPointList.length - 1
    );
    const candleIdx = clamp(
      Math.round(((xLocal - firstX) / spanX) * (sampledCandles.length - 1)),
      0,
      sampledCandles.length - 1
    );
    const candle = sampledCandles[candleIdx];
    if (!candle) {
      logHoverPerf('hideTip');
      hideTip();
      return;
    }
    const close = toNumber(candle?.close ?? candle?.value);
    const time = Number.isFinite(candle?.time) ? candle.time : null;
    if (close === null || time === null) {
      logHoverPerf('hideTip');
      hideTip();
      return;
    }
    const point = renderedPointList[ptIdx];
    // points are in viewBox coords; map to px
    const scaleX = viewBoxWidth > 0 ? rect.width / viewBoxWidth : 1;
    const scaleY = viewBoxHeight > 0 ? rect.height / viewBoxHeight : 1;
    const px = point ? point.x * scaleX : xLocal;
    const py = point ? point.y * scaleY : rect.height / 2;
    const lineX = clamp(px, 0, rect.width);
    const dotY = clamp(py, 0, rect.height);

    const nextAlign = lineX > rect.width * 0.6 ? 'left' : 'right';
    const nextIdxChanged = candleIdx !== hoverIndexRef.current;
    if (nextIdxChanged) hoverIndexRef.current = candleIdx;

    if (nextIdxChanged && typeof onHoverChange === 'function') {
      const now = Date.now();
      const canEmit = !lastEmitTsRef.current || now - lastEmitTsRef.current >= 80;
      if (canEmit) {
        lastEmitTsRef.current = now;
      // Hover % is range-based up to the hovered point: (hoverClose - firstClose) / firstClose
      let firstClose = null;
      for (let i = 0; i < sampledCandles.length; i += 1) {
        const v = toNumber(sampledCandles[i]?.close ?? sampledCandles[i]?.value);
        if (v !== null) {
          firstClose = v;
          break;
        }
      }
      const pct =
        firstClose !== null && firstClose !== 0
          ? ((close - firstClose) / firstClose) * 100
          : null;
      onHoverChange({ close, pct, time, index: candleIdx });
      }
    }

    // Update x/y always (smooth cursor), update label only when idx changes.
    logHoverPerf('setTip');
    setTip((prev) => {
      if (!prev.visible) {
        const label = `${formatPrice(close)} · ${formatCompactDate(time, range)}`;
        return { visible: true, label, x: lineX, y: dotY, align: nextAlign };
      }
      if (!nextIdxChanged) {
        if (prev.x === lineX && prev.y === dotY && prev.align === nextAlign) return prev;
        return { ...prev, x: lineX, y: dotY, align: nextAlign };
      }
      const label = `${formatPrice(close)} · ${formatCompactDate(time, range)}`;
      return { visible: true, label, x: lineX, y: dotY, align: nextAlign };
    });
  }, [hideTip, pointList, sampledCandles, showPlaceholder, viewBoxWidth, viewBoxHeight, range, onHoverChange, logHoverPerf]);

  const handlePointerMove = useCallback((event) => {
    if (isAnimatingRef.current) return;
    lastHoverClientXRef.current = event.clientX;
    if (hoverRafRef.current) return;
    hoverRafRef.current = requestAnimationFrame(() => {
      hoverRafRef.current = 0;
      updateTipAtClientX(lastHoverClientXRef.current);
    });
  }, [updateTipAtClientX, hideTip]);

  useEffect(() => {
    if (showPlaceholder || !sampledCandles.length) hideTip();
  }, [showPlaceholder, sampledCandles.length, hideTip]);

  // Warm up SVG metrics before the first draw to avoid a mid-start jank.
  // IMPORTANT: does not start/stop animation and does not touch points (only warms browser caches).
  useEffect(() => {
    const poly = polyRef.current;
    if (!poly) return undefined;
    if (showPlaceholder) return undefined;
    if (size.width <= 0 || size.height <= 0) return undefined;
    if (!displayPoints || displayPoints.length < 3) return undefined;

    const key = `${String(ticker || '').trim().toUpperCase() || 'na'}|${String(range || '').trim() || 'na'}`;
    // warm-up once per key (first render for default 3m is the important one)
    if (warmedKeyRef.current === key) return undefined;
    warmedKeyRef.current = key;

    if (warmupRafRef.current) cancelAnimationFrame(warmupRafRef.current);
    warmupRafRef.current = requestAnimationFrame(() => {
      warmupRafRef.current = 0;
      try {
        const total = poly.getTotalLength ? poly.getTotalLength() : 0;
        if (total > 0 && poly.getPointAtLength) {
          // first point + ~8% point: this is where many browsers "hiccup" if not warmed
          poly.getPointAtLength(0);
          poly.getPointAtLength(Math.min(total, total * 0.08));
        }
      } catch {}
    });

    return () => {
      if (warmupRafRef.current) {
        cancelAnimationFrame(warmupRafRef.current);
        warmupRafRef.current = 0;
      }
    };
  }, [ticker, range, showPlaceholder, size.width, size.height, displayPoints]);

  // Reset animation/points refs on range change to prevent "frozen" carryover.
  useEffect(() => {
    const domPointsStr = polyRef.current?.getAttribute('points') || '';
    logSparkTemp('range-change', {
      renderKey: renderKeyRef.current || '',
      awaitingKey: awaitingKeyRef.current || '',
      inFlightKey: inFlightKeyRef.current || '',
      isSizeSettled,
      showPlaceholder,
      isAnimatingRef: isAnimatingRef.current,
      pointsStringLen: (pointsString || '').length,
      domPointsLen: domPointsStr.length,
      domPointsCount: domPointsStr ? domPointsStr.trim().split(/\s+/).filter(Boolean).length : 0,
      pendingLen: (pendingPointsRef.current || '').length,
      latestLen: (latestPointsRef.current || '').length,
      frozenLen: (frozenPointsRef.current || '').length,
      frozenSize: frozenSizeRef.current,
    });
    frozenPointsRef.current = '';
    latestPointsRef.current = '';
    pendingPointsRef.current = '';
    inFlightKeyRef.current = '';
    didFinishAnimRef.current = false; // TEMP
    committedSigRef.current = '';
    // allow new animation for a new range
    // (seenRef is intentionally not cleared; it is used to avoid repeating animation in same range)
  }, [tickerKeyRender, rangeKeyRender]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;

      const width = Math.max(0, Math.ceil(rect.width));
      const height = Math.max(0, Math.ceil(rect.height));
      // Mark size as "unsettled" and settle only after a short quiet period.
      // This prevents first-render flicker when layout above the chart shifts.
      logSparkPerf('resize:unsettled', { size: { w: width, h: height } });
      setIsSizeSettled(false);
      if (sizeSettleTimerRef.current) {
        clearTimeout(sizeSettleTimerRef.current);
        sizeSettleTimerRef.current = 0;
      }
      const settleSize = { w: width, h: height };
      sizeSettleTimerRef.current = setTimeout(() => {
        sizeSettleTimerRef.current = 0;
        logSparkPerf('resize:settled', { size: settleSize });
        setIsSizeSettled(true);
      }, 120);

      if (isAnimatingRef.current) {
        logSparkPerf('resize:pending', { size: { w: width, h: height } });
        pendingSizeRef.current = { width, height };
        return;
      }

      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = 0;
        setSize({ width, height });
      });
    });

    resizeObserver.observe(node);

    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = 0;
      }
      if (sizeSettleTimerRef.current) {
        clearTimeout(sizeSettleTimerRef.current);
        sizeSettleTimerRef.current = 0;
      }
      try {
        resizeObserver.disconnect();
      } catch {}
    };
  }, []);

  useLayoutEffect(() => {
    const poly = polyRef.current;
    if (!poly) return undefined;
    const setAnimating = (value) => {
      isAnimatingRef.current = value;
      if (mountedRef.current) setIsAnimating(value);
    };

    const tickerKey = String(ticker || '').trim().toUpperCase() || 'na';
    const rangeKey = String(range || '').trim() || 'na';
    const canTrackSeen = tickerKey !== 'na';
    const seenKey = `${tickerKey}|${rangeKey}`;
    if (inFlightKeyRef.current === seenKey) {
      return undefined;
    }
    const alreadySeen = canTrackSeen ? seenRef.current.has(seenKey) : false;
    const inFlightSame = inFlightKeyRef.current === seenKey;
    const requestId = window.__FG_REQUEST_ID__ || null;

    // Do not enter hard-placeholder branch if we can render from frozen points;
    // otherwise we cause one-frame blanking (frozenPointsRef cleared + poly hidden).
    if (showPlaceholder && !hasFrozenPoints) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const inPostFinishWindow = now < postFinishUntilRef.current;
      // If we just finished this key, never blank the line for 1 frame.
      if (inPostFinishWindow && renderKeyRef.current === seenKey) {
        poly.style.visibility = 'visible';
        if (headRef.current) headRef.current.style.opacity = '0';
        setAnimating(false);
        return undefined;
      }
      logSparkPerf('layout:placeholder');
      // Reset all animation state when we can't render a line.
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
      animRafRef.current = 0;
      inFlightKeyRef.current = '';
      frozenPointsRef.current = '';
      poly.style.strokeDasharray = '';
      poly.style.strokeDashoffset = '';
      poly.style.visibility = 'hidden';
      if (headRef.current) headRef.current.style.opacity = '0';
      setAnimating(false);
      return undefined;
    }
    if (!showPlaceholder) {
      poly.style.visibility = 'visible';
    }

    const finishImmediate = (markSeen = true) => {
      if (animWatchdogRef.current) {
        clearTimeout(animWatchdogRef.current);
        animWatchdogRef.current = 0;
      }
      const finishTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const deltaMs = perfStartRef.current ? Math.round(finishTs - perfStartRef.current) : null;
      perfStartRef.current = 0;
      poly.style.strokeDashoffset = '0';
      poly.style.visibility = 'visible';
      try {
        requestAnimationFrame(() => {
          try {
            poly.style.strokeDasharray = '';
            poly.style.strokeDashoffset = '';
          } catch {}
        });
      } catch {
        setTimeout(() => {
          try {
            poly.style.strokeDasharray = '';
            poly.style.strokeDashoffset = '';
          } catch {}
        }, 0);
      }
      const latest = pendingPointsRef.current || latestPointsRef.current || pointsString;
      pendingPointsRef.current = '';
      if (headRef.current) headRef.current.style.opacity = '0';
      if (markSeen && canTrackSeen) seenRef.current.add(seenKey);
      inFlightKeyRef.current = '';
      // Keep frozen geometry for the next commit to avoid end-of-animation "blink"
      // (pointsString can change due to RO/size updates right after finishing).
      frozenPointsRef.current = latest || frozenPointsRef.current || '';
      poly.style.visibility = 'visible';
      // Grace window: do not allow cleanup/placeholder to hide/clear poly immediately after finish.
      postFinishUntilRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 220;
      didFinishAnimRef.current = true;
      // Force SVG repaint on cold start (Chromium/WebKit quirk)
      try { void poly.getBoundingClientRect(); void poly.ownerSVGElement?.getBoundingClientRect(); void containerRef.current?.getBoundingClientRect(); } catch {}
      logSparkPerf('repaint:forced', { pointsLen: (poly.getAttribute('points') || '').length });
      logSparkPerf('anim:finish', { markSeen, deltaMs });
      setAnimating(false);
    };

    // If we're already animating this key, do NOT restart due to resize/points updates.
    if (inFlightSame) {
      return undefined;
    }

    const largeSeriesNow = closes.length > 2000;
    if (!isStable && !alreadySeen && !largeSeriesNow) {
      poly.style.strokeDasharray = '';
      poly.style.strokeDashoffset = '';
      poly.style.visibility = 'hidden';
      if (headRef.current) headRef.current.style.opacity = '0';
      setAnimating(false);
      return undefined;
    }

    if (animRafRef.current) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = 0;
    }

    inFlightKeyRef.current = seenKey;
    didFinishAnimRef.current = false;

    // Already-seen: restore points immediately (without touching finishImmediate).
    if (
      alreadySeen &&
      awaitingKeyRef.current === renderKeyRef.current &&
      !showPlaceholder &&
      size.width > 0 &&
      size.height > 0 &&
      !isAnimatingRef.current
    ) {
      const latest = latestPointsRef.current || pointsString || frozenPointsRef.current || '';
      if (latest) {
        try {
          poly.setAttribute('points', latest);
        } catch {}
      }
    }

    if (prefersReducedMotion || alreadySeen) {
      didFinishAnimRef.current = false;
      finishImmediate(true);
      return undefined;
    }

    const latest = latestPointsRef.current || pointsString;
    const head = headRef.current;
    // Freeze geometry for the duration of the draw to avoid "second redraw" when RO updates size.
    frozenPointsRef.current = latest || pointsString;
    inFlightKeyRef.current = seenKey;
    frozenSizeRef.current = { width: size.width, height: size.height };
    try { poly.setAttribute('points', frozenPointsRef.current || ''); } catch {}
    poly.style.visibility = 'visible';
    let totalLength = 0;
    try {
      totalLength = poly.getTotalLength ? poly.getTotalLength() : 0;
    } catch {
      totalLength = 0;
    }

    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      didFinishAnimRef.current = false;
      setAnimating(false);
      return undefined;
    }

    setAnimating(true);
    didFinishAnimRef.current = false;

    perfStartRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    logSparkPerf('anim:start', {
      requestId,
      pointsLen: closes.length,
      totalLength,
    });

    poly.style.visibility = 'hidden';
    poly.style.strokeDasharray = String(totalLength);
    poly.style.strokeDashoffset = String(totalLength);
    poly.style.visibility = 'visible';

    if (head) {
      head.style.opacity = '1';
      try {
        const p0 = poly.getPointAtLength(0);
        head.setAttribute('cx', String(p0.x));
        head.setAttribute('cy', String(p0.y));
      } catch {}
    }

    // Faster + more consistent: duration depends on point count but capped tighter.
    const durationMs = clamp(closes.length * 18, 700, 1400);
    if (animWatchdogRef.current) {
      clearTimeout(animWatchdogRef.current);
      animWatchdogRef.current = 0;
    }
    animWatchdogRef.current = setTimeout(() => {
      if (animRafRef.current) {
        cancelAnimationFrame(animRafRef.current);
        animRafRef.current = 0;
      }
      finishImmediate(true);
    }, durationMs + 150);
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const drawLen = totalLength * eased;
      poly.style.strokeDashoffset = String(Math.max(0, totalLength - drawLen));

      if (head) {
        try {
          const p = poly.getPointAtLength(drawLen);
          head.setAttribute('cx', String(p.x));
          head.setAttribute('cy', String(p.y));
        } catch {}
      }

      if (t < 1) {
        animRafRef.current = requestAnimationFrame(step);
      } else {
        finishImmediate(true); // clears dasharray/dashoffset -> line becomes solid
        animRafRef.current = 0;
      }
    };

    animRafRef.current = requestAnimationFrame(step);

    return () => {
      if (animWatchdogRef.current) {
        clearTimeout(animWatchdogRef.current);
        animWatchdogRef.current = 0;
      }
      const sameKey = renderKeyRef.current === seenKey;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const inPostFinishWindow = sameKey && now < postFinishUntilRef.current;
      // Critical: prevent cleanup from blanking the polyline right after finish for the same key.
      if (inPostFinishWindow) {
        if (head) head.style.opacity = '0';
        return;
      }
      if (isAnimatingRef.current && sameKey) {
        return;
      }
      const resetDraw = () => {
        poly.style.strokeDasharray = '';
        poly.style.strokeDashoffset = '';
        if (!didFinishAnimRef.current) {
          poly.style.visibility = 'hidden';
        }
        if (!didFinishAnimRef.current) {
          if (!sameKey) {
            poly.setAttribute('points', '');
            inFlightKeyRef.current = '';
            frozenPointsRef.current = '';
          }
        }
        setAnimating(false);
      };
      if (animRafRef.current) {
        cancelAnimationFrame(animRafRef.current);
        animRafRef.current = 0;
        resetDraw();
      }
      if (head) head.style.opacity = '0';
    };
  }, [pointsString, showPlaceholder, prefersReducedMotion, ticker, range, closes.length, isStable, size.width, size.height]);

  return (
    <div
      className="compact-trend-chart"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
      onPointerLeave={hideTip}
      onPointerUp={hideTip}
      onPointerCancel={hideTip}
    >
      <svg
        aria-hidden="true"
        style={{ width: '100%', height: '100%', display: 'block' }}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        <>
          <polyline
            ref={polyRef}
            fill="none"
            stroke="#4fd1c5"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              // Subtle glow like in the template (no heavy blur).
              filter: 'drop-shadow(0 0 10px rgba(79, 209, 197, 0.18))',
            }}
          />
          <circle ref={headRef} r="2" fill="#4fd1c5" opacity="0" />
        </>
      </svg>
      {tip.visible && Number.isFinite(tip.x) && Number.isFinite(tip.y) && (
        <>
          <div className="compact-sparkline-hairline" style={{ left: `${tip.x}px` }} />
          <div className="compact-sparkline-dot" style={{ left: `${tip.x}px`, top: `${tip.y}px` }} />
        </>
      )}
    </div>
  );
};

CompactSparkline.propTypes = {
  chartData: PropTypes.shape({
    candles: PropTypes.array,
  }),
  ticker: PropTypes.string,
  range: PropTypes.string,
};

export default CompactSparkline;
