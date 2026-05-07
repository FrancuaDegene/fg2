import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createChart } from 'lightweight-charts';
import { useChartHover } from '../hooks/useChartHover';
import ChartTooltip from '../ChartTooltip';
import { normalizeTimeValue, toTimestampMs } from '../utils/chartTimeUtils';
import './CompactTrendChart.css';

const MAX_POINTS = 300;

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const addAreaSeriesCompat = (chart, options) => chart.addAreaSeries(options);

const CompactTrendChart = ({ chartData, ticker, range }) => {
  const REVEAL_MS = 420;
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const hoverContextRef = useRef({ byTime: new Map(), seriesKind: 'line' });
  const isZoomingRef = useRef(false);
  const lastSignatureRef = useRef(null);
  const seenRangesRef = useRef(new Map()); // ticker -> Set(ranges) (animate once per range per ticker)
  const pendingSeenRef = useRef(null); // { tickerKey, rangeKey } to mark after animated show
  const revealTimerRef = useRef(0);
  const [isRevealActive, setIsRevealActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // TEMP/SAFE: local tooltip for compact (bypass useChartHover)
  const [compactTip, setCompactTip] = useState({
    visible: false,
    data: null,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = 0;
      }
    };
  }, []);

  const prefersReducedMotion = useMemo(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  const points = useMemo(() => {
    const candles = Array.isArray(chartData?.candles) ? chartData.candles : [];

    const mapCandle = (candle) => {
      const value = toNumber(candle?.close ?? candle?.value);
      const time = Number.isFinite(candle?.time) ? candle.time : null;
      if (value === null || time === null) return null;
      return { time, value };
    };

    const logPoints = (arr) => {
      const invalidTimeCount = arr.filter((p) => !Number.isFinite(p?.time)).length;
      // eslint-disable-next-line no-console
      console.log('[CompactTrend][pointsMemo]', {
        length: arr.length,
        invalidTimeCount,
      });
    };

    if (candles.length === 0) {
      logPoints([]);
      return [];
    }

    const total = candles.length;
    const max = MAX_POINTS;

    if (total <= max) {
      const mapped = candles.map(mapCandle).filter(Boolean);
      logPoints(mapped);
      return mapped;
    }

    const step = (total - 1) / (max - 1);
    const result = [];

    for (let i = 0; i < max; i += 1) {
      const idx = Math.round(i * step);
      const candle = candles[idx];
      if (!candle) continue;
      const mapped = mapCandle(candle);
      if (mapped) result.push(mapped);
    }

    logPoints(result);
    return result;
  }, [chartData]);

  // Δ / Δ% относительно начала выбранного диапазона
  const rangeDelta = useMemo(() => {
    if (!points || points.length < 2) return null;
    const first = Number(points[0]?.value);
    const last = Number(points[points.length - 1]?.value);
    if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
    const delta = last - first;
    const deltaPct = (delta / first) * 100;
    return { first, last, delta, deltaPct };
  }, [points]);

  useEffect(() => {
    const byTime = new Map();
    points.forEach((p) => {
      if (!p) return;
      const normalized = normalizeTimeValue(p.time);
      if (normalized === null) return;
      const price = Number(p.value);
      byTime.set(normalized, {
        time: normalized,
        timeMs: toTimestampMs(normalized),
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
      });
    });
    const baseline = points[0]?.value ?? null;
    hoverContextRef.current = {
      byTime,
      seriesKind: 'line',
      baseline,
      symbolId: ticker ? String(ticker).toUpperCase() : null,
      onHover: undefined,
    };
  }, [points, ticker]);

  useChartHover({
    chartInstanceRef: chartRef,
    seriesRef,
    hoverContextRef,
    containerRef,
    isZoomingRef,
    showTooltip: true,
    onHover: undefined,
  });

  // Fade key should NOT depend on range: range changes must not trigger enter animation.
  // We animate only on first appearance / ticker change.
  const fadeKey = useMemo(() => {
    const t = String(ticker || '').trim().toUpperCase();
    return t || 'na';
  }, [ticker]);

  const signature = useMemo(() => {
    const first = points[0]?.time ?? 'na';
    const last = points[points.length - 1]?.time ?? 'na';
    return `${fadeKey}:${points.length}:${first}:${last}`;
  }, [fadeKey, points]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (chartRef.current) return undefined;

    const chart = createChart(container, {
      layout: {
        background: { type: 'solid', color: 'rgba(0, 0, 0, 0)' },
        textColor: 'rgba(154, 164, 181, 0.8)',
      },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: {
        visible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        timeVisible: true,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0,
        vertLine: { visible: true, labelVisible: false },
        horzLine: { visible: false },
      },
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: false,
        axisDoubleClickReset: false,
        mouseWheelSensitivity: 0,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
    });

    const series = addAreaSeriesCompat(chart, {
      lineColor: '#4fd1c5',
      topColor: 'rgba(79, 209, 197, 0.35)',
      bottomColor: 'rgba(79, 209, 197, 0.05)',
      lineWidth: 2,
      priceScaleId: 'right',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param) => {
      const seriesDataForRef = param?.seriesData?.get?.(seriesRef.current);
      const hasPoint = !!param?.point;
      const t = param?.time ?? null;
      const value = seriesDataForRef?.value ?? seriesDataForRef?.close ?? null;
      if (!hasPoint || t == null || value == null) {
        setCompactTip((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const timeSec = normalizeTimeValue(t);
      setCompactTip({
        visible: true,
        position: { x: param.point.x, y: param.point.y },
        data: {
          time: timeSec,
          open: value,
          high: value,
          low: value,
          close: value,
          volume: 0,
        },
      });
    });

    return () => {
      seriesRef.current = null;
      chartRef.current = null;
      try {
        chart.remove();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || !points.length) return;
    if (lastSignatureRef.current !== signature) {
      // eslint-disable-next-line no-console
      console.log('[CompactTrend][sig]', signature, 'prev', lastSignatureRef.current);
      lastSignatureRef.current = signature;
    }

    const tickerKeyRaw = String(ticker || '').trim().toUpperCase();
    const tickerKey = tickerKeyRaw || 'na';
    const rangeKey = String(range || '').trim() || 'na';
    // If ticker is not resolved yet, do NOT "consume" the one-time animation.
    // We'll animate, but we won't store seen state until tickerKey becomes valid.
    const canTrackSeen = tickerKey !== 'na';
    let rangeSet = null;
    if (canTrackSeen) {
      rangeSet = seenRangesRef.current.get(tickerKey);
      if (!rangeSet) {
        rangeSet = new Set();
        seenRangesRef.current.set(tickerKey, rangeSet);
      }
    }
    const shouldAnimate = !canTrackSeen ? true : !rangeSet.has(rangeKey);

    // Ensure a clean fade-in when we DO animate (first show / ticker changed).
    // Range changes won't set shouldAnimate=true anymore.
    if (shouldAnimate) setIsVisible(false);

    const invalidPoints = points.filter((p) => !Number.isFinite(p?.time));
    const invalidTimeCount = invalidPoints.length;
    const sampleInvalid = invalidPoints[0] ?? null;
    const firstPoint = points[0] ?? null;
    const lastPoint = points[points.length - 1] ?? null;
    const logSetDataDiagnostics = (tag) => {
      const containerNode = containerRef.current;
      const containerSize = containerNode
        ? {
            clientWidth: containerNode.clientWidth,
            clientHeight: containerNode.clientHeight,
          }
        : null;
      // eslint-disable-next-line no-console
      console.log('[CompactTrend][setDataDiag]', {
        tag,
        length: points.length,
        invalidTimeCount,
        sampleInvalid,
        firstPoint,
        lastPoint,
        containerSize,
      });
    };

    if (points.length < 2) {
      // Keep container visible via showEmpty, but reset visibility so the first real data can fade in.
      setIsVisible(false);
      // eslint-disable-next-line no-console
      console.log('[CompactTrend][skipSetData]', {
        reason: 'insufficient-points',
        length: points.length,
      });
      return;
    }

    let sizeRetry = 0;
    const isContainerReady = () => {
      const node = containerRef.current;
      const ready = Boolean(node && node.clientWidth > 0 && node.clientHeight > 0);
      if (!ready && node) {
        // eslint-disable-next-line no-console
        console.warn('[FG][CompactTrend][containerZero]', {
          width: node.clientWidth,
          height: node.clientHeight,
        });
      }
      return ready;
    };

    const markSeen = () => {
      if (canTrackSeen && rangeSet) rangeSet.add(rangeKey);
      const p = pendingSeenRef.current;
      if (p && p.tickerKey !== 'na') {
        let s = seenRangesRef.current.get(p.tickerKey);
        if (!s) {
          s = new Set();
          seenRangesRef.current.set(p.tickerKey, s);
        }
        s.add(p.rangeKey);
      }
      pendingSeenRef.current = null;
    };

    const fit = () => {
      try {
        chart.timeScale().fitContent();
      } catch {}
    };
    const runSetData = (tag) => {
      logSetDataDiagnostics(tag);
      series.setData(points);
      fit();
      // For non-animated path, we can mark seen immediately (no need to wait).
      markSeen();
    };
    const trySetData = (tag, allowRetry, onSuccess) => {
      if (isContainerReady()) {
        runSetData(tag);
        if (typeof onSuccess === 'function') onSuccess();
        return true;
      }
      if (allowRetry) {
        sizeRetry = requestAnimationFrame(() => {
          sizeRetry = 0;
          if (!isContainerReady()) {
            // eslint-disable-next-line no-console
            console.log('[CompactTrend][skipSetData]', {
              reason: 'container-zero',
              tag,
            });
            return;
          }
          runSetData(tag);
          if (typeof onSuccess === 'function') onSuccess();
        });
      }
      return false;
    };

    if (!shouldAnimate) {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = 0;
      }
      setIsRevealActive(false);
      trySetData('immediate', true, () => setIsVisible(true));
      return () => {
        try {
          if (sizeRetry) cancelAnimationFrame(sizeRetry);
        } catch {}
      };
    }

    setIsVisible(false);
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = 0;
    }
    setIsRevealActive(false);
    // Mark seen ONLY after we actually show (animated), to avoid "consuming" animation too early.
    pendingSeenRef.current = canTrackSeen ? { tickerKey, rangeKey } : null;

    if (prefersReducedMotion) {
      trySetData('reduced-motion', true, () => setIsVisible(true));
      return () => {
        try {
          if (sizeRetry) cancelAnimationFrame(sizeRetry);
        } catch {}
      };
    }

    let rafShow = 0;
    const rafData = requestAnimationFrame(() => {
      trySetData('raf-data', true, () => {
        rafShow = requestAnimationFrame(() => {
          setIsVisible(true);
          setIsRevealActive(true);
          revealTimerRef.current = setTimeout(() => {
            setIsRevealActive(false);
            revealTimerRef.current = 0;
          }, REVEAL_MS);
          markSeen();
        });
      });
    });

    return () => {
      try {
        cancelAnimationFrame(rafData);
        if (rafShow) cancelAnimationFrame(rafShow);
        if (sizeRetry) cancelAnimationFrame(sizeRetry);
      } catch {}
    };
  }, [points, signature, fadeKey, prefersReducedMotion]);

  const showEmpty = points.length < 2;
  const shellRef = useRef(null); // outer shell for tooltip bounds / overlays

  return (
    <div className="compact-trend-chart" ref={shellRef}>
      {/* Chart host (this is what we animate) */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translate3d(0,0,0)' : 'translate3d(0,8px,0)',
          willChange: 'opacity, transform',
          transition: 'opacity 320ms ease, transform 320ms ease',
          pointerEvents: 'auto',
        }}
      />
      <div
        className={`compact-trend-chart__reveal ${isRevealActive ? 'is-active' : ''}`}
        aria-hidden="true"
      />
      {compactTip.data && (
        <ChartTooltip
          data={compactTip.data}
          isVisible={compactTip.visible}
          position={compactTip.position}
          containerRef={shellRef}
        />
      )}
      {showEmpty && (
        <div className="compact-trend-chart__empty">
          <div>Введите тикер, чтобы увидеть тренд</div>
          <div>Данные появятся после поиска</div>
        </div>
      )}
    </div>
  );
};

CompactTrendChart.propTypes = {
  chartData: PropTypes.shape({
    candles: PropTypes.array,
    error: PropTypes.any,
  }),
  ticker: PropTypes.string,
  range: PropTypes.string,
};

export default CompactTrendChart;
