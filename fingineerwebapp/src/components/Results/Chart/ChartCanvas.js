// src/components/Results/Chart/ChartCanvas.js
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  memo,
} from 'react';
import { createChart, LineStyle } from 'lightweight-charts';
import { calculateBarSpacing, createSeries, prepareData } from './utils/chartUtils';
import ChartTooltip from './ChartTooltip';
import { useChart } from './ChartContext';
import { useIndicatorsEngine } from './useIndicatorsEngine';

const SERIES_KIND = Object.freeze({
  CANDLES: 'candles',
  LINE: 'line',
});

const RSI_SCALE_ID = 'rsi-scale';

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const resolveSeriesKind = (type) => {
  const key = (type || '').toString().toLowerCase();
  if (
    key === 'line' ||
    key === 'line_with_markers' ||
    key === 'stepped_line' ||
    key === 'tick_chart' ||
    key === 'area' ||
    key === 'area_hlc' ||
    key === 'baseline'
  ) {
    return SERIES_KIND.LINE;
  }
  return SERIES_KIND.CANDLES;
};

const normalizeTimeValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    if ('timestamp' in value && Number.isFinite(Number(value.timestamp))) {
      return Number(value.timestamp);
    }
    if ('year' in value && 'month' in value && 'day' in value) {
      const date = Date.UTC(
        Number(value.year),
        Number(value.month) - 1,
        Number(value.day)
      );
      return Number.isFinite(date) ? Math.floor(date / 1000) : null;
    }
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toTimestampMs = (time) => {
  if (time === null || time === undefined) return null;
  const num = Number(time);
  if (!Number.isFinite(num)) return null;
  return num > 1e12 ? Math.floor(num) : Math.floor(num * 1000);
};

const registerTimeKeys = (map, timeValue, entry) => {
  if (timeValue === null || timeValue === undefined) return;
  const primary = Number(timeValue);
  if (!Number.isFinite(primary)) return;
  map.set(primary, entry);
  const ms = toTimestampMs(primary);
  if (ms !== null) map.set(ms, entry);
  const seconds = ms !== null ? Math.floor(ms / 1000) : Math.floor(primary);
  if (Number.isFinite(seconds)) map.set(seconds, entry);
};

const resolvePriceScaleBorder = (expanded) => (expanded ? 'rgba(126, 134, 152, 0.65)' : 'rgba(48, 52, 64, 0.35)');

const FPS_LIMIT_MS = 1000 / 30; // ~33ms cap for crosshair updates
const ZOOM_IDLE_TIMEOUT = 160;   // ms after wheel/zoom to re-enable hover

const ChartCanvas = memo(function ChartCanvas({
  chartData,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  isChartLoading,
  isExpanded,
  onHover,
  symbolId,
  prevClose,
  showTooltip = true,
}) {
  const { activeIndicators } = useChart();
  const { sma, ema, rsi } = useIndicatorsEngine();

  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const prevCloseLineRef = useRef(null);
  const indicatorsSeriesRef = useRef({});
  const resizeObserverRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const rafIdRef = useRef(null);
  const crosshairHandlerRef = useRef(null);
  const hoverLeaveTimerRef = useRef(null);
  const isZoomingRef = useRef(false);
  const zoomIdleTimerRef = useRef(null);
  const lastFrameTsRef = useRef(0);
  const lastCrosshairRef = useRef({
    time: null,
    x: null,
    y: null,
  });
  const hoverContextRef = useRef({
    byTime: new Map(),
    baseline: null,
    seriesKind: SERIES_KIND.CANDLES,
    symbolId: symbolId || null,
    onHover: typeof onHover === 'function' ? onHover : null,
  });

  const indCacheRef = useRef(new Map());
  const indGenRef   = useRef(0);

  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const seriesKind = resolveSeriesKind(currentCandleType);

  const normalizedCandles = useMemo(() => {
    const raw = Array.isArray(chartData?.candles) ? chartData.candles : [];
    if (raw.length === 0) {
      return { list: [], byTime: new Map(), baseline: null };
    }

    const sorted = raw
      .map((candle) => {
        const time = normalizeTimeValue(candle?.time);
        if (time === null) return null;
        const open = toNumber(candle?.open);
        const high = toNumber(candle?.high);
        const low = toNumber(candle?.low);
        const close = toNumber(candle?.close);
        const volume = toNumber(candle?.volume);
        return {
          time,
          timeMs: toTimestampMs(time),
          open,
          high,
          low,
          close,
          volume,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    const byTime = new Map();
    sorted.forEach((entry, index) => {
      const prev = index > 0 ? sorted[index - 1] : null;
      const enriched = {
        ...entry,
        prevClose: prev ? prev.close : null,
      };
      registerTimeKeys(byTime, entry.time, enriched);
    });

    const baseline = sorted.find((item) => item.close !== null)?.close ?? null;

    return { list: sorted, byTime, baseline };
  }, [chartData?.candles]);

  const candleByTime = normalizedCandles.byTime;
  const candleBaseline = normalizedCandles.baseline;
  const indicatorSource = normalizedCandles.list;

  // Мы намеренно оставляем []: компонент ремонтируется по key при смене isExpanded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const layoutOptions = isExpanded
      ? { textColor: 'rgba(148, 153, 161, 0.9)', background: { type: 'solid', color: '#ffffff' } }
      : { textColor: 'rgba(208, 214, 224, 0.88)', background: { type: 'solid', color: '#131722' } };

    const gridOptions = isExpanded
      ? {
          vertLines: { visible: false },
          horzLines: { color: 'rgba(154, 160, 166, 0.15)', style: 0, visible: true },
        }
      : {
          vertLines: { visible: false },
          horzLines: { color: 'rgba(108, 119, 136, 0.28)', style: 0, visible: true },
        };

    const priceScaleOptions = isExpanded
      ? {
          visible: true,
          borderVisible: true,
          borderColor: resolvePriceScaleBorder(true),
          autoScale: true,
          scaleMargins: { top: 0.08, bottom: 0.08 },
          textColor: 'rgba(154, 160, 166, 0.75)',
        }
      : {
          visible: true,
          borderVisible: true,
          borderColor: resolvePriceScaleBorder(false),
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 },
          textColor: 'rgba(198, 206, 218, 0.78)',
        };

    const chart = createChart(container, {
      layout: layoutOptions,
      grid: gridOptions,
      width: container.clientWidth,
      height: container.clientHeight,
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: true, mouseWheelSensitivity: 0.15 },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      timeScale: { timeVisible: true, borderVisible: false, borderColor: 'transparent', fixLeftEdge: true, fixRightEdge: true, rightOffset: 12, minBarSpacing: 0.5, barSpacing: 6 },
      crosshair: { mode: 0 },
      rightPriceScale: priceScaleOptions,
      leftPriceScale: { visible: false },
    });

    chartInstanceRef.current = chart;

    const scheduleHoverReset = (hoverCtx) => {
      if (hoverLeaveTimerRef.current) return;
      hoverLeaveTimerRef.current = setTimeout(() => {
        hoverLeaveTimerRef.current = null;
        if (hoverCtx?.onHover) {
          hoverCtx.onHover(null);
        }
      }, 180);
    };

    const cancelHoverReset = () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
        hoverLeaveTimerRef.current = null;
      }
    };

    const handleCrosshairMove = (param) => {
      if (isZoomingRef.current) {
        if (hoverContextRef.current.onHover) {
          hoverContextRef.current.onHover(null);
        }
        setTooltipVisible(false);
        return;
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastFrameTsRef.current < FPS_LIMIT_MS) {
        return;
      }
      lastFrameTsRef.current = now;

      const nextTime = param?.time ?? null;
      const nextPoint = param?.point ?? null;
      const lastCrosshair = lastCrosshairRef.current;
      if (
        lastCrosshair.time === nextTime &&
        lastCrosshair.x === (nextPoint ? nextPoint.x : null) &&
        lastCrosshair.y === (nextPoint ? nextPoint.y : null)
      ) {
        return;
      }

      const hoverCtx = hoverContextRef.current;
      const emitHover = hoverCtx.onHover;
      let emitted = false;

      if (param?.point && param.seriesData.size > 0 && seriesRef.current) {
        const seriesData = param.seriesData.get(seriesRef.current);
        if (seriesData) {
          cancelHoverReset();

          lastCrosshairRef.current = {
            time: nextTime,
            x: param.point?.x ?? null,
            y: param.point?.y ?? null,
          };

          const rawTime = seriesData.time ?? param.time ?? null;
          const normalizedTime = normalizeTimeValue(rawTime);
          const lookup = normalizedTime !== null ? hoverCtx.byTime.get(normalizedTime) : undefined;
          const timeMs = lookup?.timeMs ?? (normalizedTime !== null ? toTimestampMs(normalizedTime) : null);

          let tooltipPayload = null;

          if (hoverCtx.seriesKind === SERIES_KIND.CANDLES) {
            const open = toNumber(seriesData.open ?? lookup?.open);
            const high = toNumber(seriesData.high ?? lookup?.high);
            const low = toNumber(seriesData.low ?? lookup?.low);
            const close = toNumber(seriesData.close ?? lookup?.close);
            const volume = toNumber(seriesData.volume ?? lookup?.volume);

            if (close !== null) {
              if (emitHover) {
                emitHover({
                  kind: SERIES_KIND.CANDLES,
                  symbolId: hoverCtx.symbolId || null,
                  ts: timeMs,
                  price: close,
                  open: open ?? close,
                  high: high ?? close,
                  low: low ?? close,
                  close,
                  volume: volume ?? null,
                  prevClose: lookup?.prevClose ?? null,
                });
                emitted = true;
              }

              tooltipPayload = {
                time: normalizedTime ?? seriesData.time ?? 0,
                open: open ?? close,
                high: high ?? close,
                low: low ?? close,
                close,
                volume: volume ?? 0,
              };
            }
          } else {
            const price = toNumber(seriesData.value ?? seriesData.close ?? lookup?.close);
            const volume = toNumber(lookup?.volume);
            if (price !== null) {
              if (emitHover) {
                emitHover({
                  kind: SERIES_KIND.LINE,
                  symbolId: hoverCtx.symbolId || null,
                  ts: timeMs,
                  price,
                  baseline: hoverCtx.baseline ?? lookup?.prevClose ?? null,
                  volume: volume ?? null,
                });
                emitted = true;
              }

              tooltipPayload = {
                time: normalizedTime ?? seriesData.time ?? 0,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: volume ?? 0,
              };
            }
          }

          if (tooltipPayload) {
            setTooltipData(tooltipPayload);
            setTooltipPosition({ x: param.point.x, y: param.point.y });
            setTooltipVisible(true);
          } else {
            setTooltipVisible(false);
          }

          if (!emitted && emitHover) {
            emitHover(null);
          }
          return;
        }
      }

      lastCrosshairRef.current = {
        time: nextTime,
        x: nextPoint ? nextPoint.x ?? null : null,
        y: nextPoint ? nextPoint.y ?? null : null,
      };
      setTooltipVisible(false);
      scheduleHoverReset(hoverCtx);
    };
    crosshairHandlerRef.current = handleCrosshairMove;
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const timeScale = chart.timeScale();
    const handleRangeChange = () => {
      isZoomingRef.current = true;
      if (zoomIdleTimerRef.current) {
        clearTimeout(zoomIdleTimerRef.current);
      }
      zoomIdleTimerRef.current = setTimeout(() => {
        isZoomingRef.current = false;
      }, ZOOM_IDLE_TIMEOUT);
    };
    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;

      const width  = Math.max(0, Math.ceil(rect.width));
      const height = Math.max(0, Math.ceil(rect.height));

      if (width === 0 || height === 0) return;
      if (width === lastSizeRef.current.width && height === lastSizeRef.current.height) return;

      lastSizeRef.current.width = width;
      lastSizeRef.current.height = height;

      try { resizeObserver.unobserve(container); } catch {}

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        try {
          const ch = crosshairHandlerRef.current;
          if (ch) chart.unsubscribeCrosshairMove(ch);

          chart.resize(width, height);
          const ts = chart.timeScale();
          ts.applyOptions({ rightOffset: 0 });
          ts.scrollToRealTime();
          ts.fitContent();

          if (ch) chart.subscribeCrosshairMove(ch);
        } catch (e) {
          console.warn('Chart resize error:', e);
        } finally {
          rafIdRef.current = null;
          try { resizeObserver.observe(container); } catch {}
        }
      });
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      // стоп RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // стоп observer
      if (resizeObserverRef.current) {
        try { resizeObserverRef.current.disconnect(); } catch {}
        resizeObserverRef.current = null;
      }
      // очистка индикаторов
      Object.values(indicatorsSeriesRef.current).forEach((s) => {
        try { s.setData([]); } catch {}
        try { chart.removeSeries(s); } catch {}
      });
      indicatorsSeriesRef.current = {};

      // очистка базовой серии
      if (seriesRef.current) {
        try { seriesRef.current.setData([]); } catch {}
        try {
          if (prevCloseLineRef.current) {
            seriesRef.current.removePriceLine(prevCloseLineRef.current);
          }
        } catch {}
        try { chart.removeSeries(seriesRef.current); } catch {}
        seriesRef.current = null;
        prevCloseLineRef.current = null;
      }

      // отписка кроссхейра
      try {
        if (crosshairHandlerRef.current) {
          chart.unsubscribeCrosshairMove(crosshairHandlerRef.current);
        }
      } catch {}
      crosshairHandlerRef.current = null;

      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
        hoverLeaveTimerRef.current = null;
      }

      // удаление чарта
      try { chart.remove(); } catch {}
      chartInstanceRef.current = null;
      isZoomingRef.current = false;
      if (zoomIdleTimerRef.current) {
        clearTimeout(zoomIdleTimerRef.current);
        zoomIdleTimerRef.current = null;
      }
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}

      lastCrosshairRef.current = { time: null, x: null, y: null };
    };
  }, [isExpanded]);

  // реагируем на смену режима (перекраска сетки/лейаута)
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const layoutOptions = isExpanded
      ? { textColor: '#6d768a', background: { type: 'solid', color: '#ffffff' } }
      : { textColor: '#d1d4dc', background: { type: 'solid', color: '#131722' } };

    const gridOptions = isExpanded
      ? { vertLines: { color: 'rgba(210, 218, 233, 0.35)' }, horzLines: { color: 'rgba(210, 218, 233, 0.28)' } }
      : { vertLines: { color: 'rgba(42, 46, 57, 0.18)' },  horzLines: { color: 'rgba(42, 46, 57, 0.18)' } };

    chart.applyOptions({ layout: layoutOptions, grid: gridOptions });
    chart.timeScale().applyOptions({
      borderVisible: true,
      borderColor: isExpanded ? 'rgba(210, 218, 233, 0.35)' : 'rgba(42, 46, 57, 0.18)',
      timeVisible: true,
    });

    chart.priceScale('right').applyOptions({
      visible: true,
      borderVisible: true,
      borderColor: resolvePriceScaleBorder(isExpanded),
      textColor: isExpanded ? '#6d768a' : '#d1d4dc',
    });
  }, [isExpanded]);

  // подготовка данных свечей/баров
  const preparedData = useMemo(() => {
    const rawCandles = chartData?.candles || [];
    return Array.isArray(rawCandles) && rawCandles.length > 0
      ? prepareData(rawCandles, currentCandleType)
      : [];
  }, [chartData?.candles, currentCandleType]);

  const lineBaseline = useMemo(() => {
    if (seriesKind !== SERIES_KIND.LINE) {
      return null;
    }
    if (!preparedData || preparedData.length === 0) {
      return candleBaseline ?? null;
    }
    const first = preparedData.find((item) => {
      const val = toNumber(item?.value ?? item?.close);
      return val !== null;
    });
    if (first) {
      return toNumber(first.value ?? first.close);
    }
    return candleBaseline ?? null;
  }, [seriesKind, preparedData, candleBaseline]);

  useEffect(() => {
    const reference = toNumber(prevClose);
    hoverContextRef.current = {
      byTime: candleByTime,
      baseline: reference ?? (
        seriesKind === SERIES_KIND.LINE
          ? lineBaseline ?? candleBaseline ?? null
          : candleBaseline ?? null
      ),
      seriesKind,
      symbolId: symbolId || null,
      onHover: typeof onHover === 'function' ? onHover : null,
    };
  }, [candleByTime, candleBaseline, seriesKind, symbolId, onHover, lineBaseline, prevClose]);

  useEffect(() => {
    if (typeof onHover === 'function') {
      onHover(null);
    }
  }, [onHover, currentInterval, currentTimeframe, currentCandleType]);

  useEffect(() => {
    return () => {
      if (typeof onHover === 'function') {
        onHover(null);
      }
    };
  }, [onHover]);

  // базовая серия
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      try { seriesRef.current.setData([]); } catch {}
      try {
        if (prevCloseLineRef.current) {
          seriesRef.current.removePriceLine(prevCloseLineRef.current);
        }
      } catch {}
      try { chart.removeSeries(seriesRef.current); } catch (error) {
        console.warn('Could not remove series', error);
      }
      seriesRef.current = null;
      prevCloseLineRef.current = null;
    }

    const baseSeries = createSeries(chart, currentCandleType);
    seriesRef.current = baseSeries;
    try { baseSeries.setData([]); } catch {}

    try {
      if (preparedData.length > 0) {
        baseSeries.setData(preparedData);
      }
    } catch (err) {
      console.warn('Chart series update error:', err);
    }

    chart.timeScale().applyOptions({
      barSpacing: calculateBarSpacing(currentInterval, currentTimeframe),
      secondsVisible: currentInterval === '1m',
    });

    setTimeout(() => {
      try { chart.timeScale().fitContent(); } catch {}
    }, 50);

    }, [currentCandleType, currentInterval, currentTimeframe, preparedData, seriesKind]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return undefined;

    const cleanupLine = () => {
      if (prevCloseLineRef.current) {
        try { series.removePriceLine(prevCloseLineRef.current); } catch {}
        prevCloseLineRef.current = null;
      }
    };

    const price = toNumber(prevClose);
    if (price === null || currentCandleType === 'baseline') {
      cleanupLine();
      return undefined;
    }

    cleanupLine();
    try {
      prevCloseLineRef.current = series.createPriceLine({
        price,
        color: 'rgba(120, 132, 153, 0.85)',
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'Пред.',
      });
    } catch (err) {
      console.warn('[ChartCanvas] prevClose price line failed', err);
      prevCloseLineRef.current = null;
    }

    return () => {
      cleanupLine();
    };
  }, [prevClose, currentCandleType, seriesKind]);

  useEffect(() => {
    if (currentCandleType !== 'baseline') return;
    const series = seriesRef.current;
    if (!series) return;
    const baseValue = (toNumber(prevClose) ?? lineBaseline ?? candleBaseline) ?? null;
    if (baseValue === null) return;
    try {
      series.applyOptions({
        baseValue: { type: 'price', price: baseValue },
      });
    } catch (err) {
      console.warn('[ChartCanvas] apply baseline baseValue failed', err);
    }
  }, [currentCandleType, prevClose, lineBaseline, candleBaseline]);

  // индикаторы
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const myGen = ++indGenRef.current;

    const ch = crosshairHandlerRef.current;
    if (ch) chart.unsubscribeCrosshairMove(ch);

      Object.values(indicatorsSeriesRef.current).forEach(series => {
        try { series.setData([]); } catch {}
        try { chart.removeSeries(series); } catch {}
      });
      indicatorsSeriesRef.current = {};
      try {
        chart.priceScale(RSI_SCALE_ID).applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
          borderVisible: false,
        });
      } catch {}
      try {
        chart.priceScale('right').applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
        });
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
          borderVisible: false,
        });
      } catch {}

    if (!indicatorSource || indicatorSource.length === 0) {
      if (ch) chart.subscribeCrosshairMove(ch);
      return;
    }

    const jobs = (activeIndicators || [])
      .filter((ind) => ind && ind.visible !== false)
      .map(async (ind) => {
        if (ind.id === 'volume') {
          const histogram = chart.addHistogramSeries({
            priceScaleId: 'volume',
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
            priceLineVisible: false,
            base: 0,
          });
          indicatorsSeriesRef.current[ind.id] = histogram;

          try {
            chart.priceScale('right').applyOptions({
              scaleMargins: { top: 0, bottom: 0.22 },
            });
            chart.priceScale('volume').applyOptions({
              scaleMargins: { top: 0.78, bottom: 0 },
              borderVisible: false,
              textColor: 'rgba(154, 160, 166, 0.55)',
            });
          } catch {}

          const mapped = indicatorSource.map((candle) => {
            const open = toNumber(candle.open) ?? 0;
            const close = toNumber(candle.close) ?? 0;
            return {
              time: candle.time,
              value: toNumber(candle.volume) ?? 0,
              color: close >= open ? '#26a69a' : '#ef5350',
            };
          });

          try { histogram.setData(mapped); } catch {}
          return;
        }

        const isRsi = ind.id === 'rsi';
        const isMa = ind.id === 'ma';
        const isEma = ind.id === 'ema';
        const showRsiLevels = isRsi ? ind.settings?.showLevels !== false : false;
        const defaultColor = isRsi
          ? 'rgba(244, 67, 54, 0.9)'
          : isMa
          ? 'rgba(52, 152, 219, 0.9)'
          : isEma
          ? 'rgba(243, 156, 18, 0.9)'
          : 'rgba(76, 175, 80, 0.9)';
        const color = ind.color || defaultColor;

        const series = chart.addLineSeries({
          color,
          lineWidth: isMa || isEma ? 2.4 : 2,
          priceScaleId: isRsi ? RSI_SCALE_ID : 'right',
          lastValueVisible: !isRsi,
          priceLineVisible: !isRsi,
        });
        try { series.setData([]); } catch {}
        indicatorsSeriesRef.current[ind.id] = series;

        if (isRsi) {
          chart.priceScale(RSI_SCALE_ID).applyOptions({
            scaleMargins: { top: 0.72, bottom: 0.02 },
            borderVisible: false,
          });
          series.applyOptions({
            priceFormat: {
              type: 'custom',
              formatter: (val) => (val != null ? Math.round(val).toString() : ''),
            },
          });
          if (showRsiLevels) {
            try {
              series.createPriceLine({
                price: 70,
                color: '#9ca3af',
                lineStyle: LineStyle.Dashed,
                lineWidth: 1,
                axisLabelVisible: true,
                title: '70',
              });
              series.createPriceLine({
                price: 30,
                color: '#9ca3af',
                lineStyle: LineStyle.Dashed,
                lineWidth: 1,
                axisLabelVisible: true,
                title: '30',
              });
            } catch {}
          }
        }

        const key = JSON.stringify({
          id: ind.id,
          params: ind.params || {},
          len: indicatorSource.length,
          candleType: currentCandleType,
          interval: currentInterval,
          timeframe: currentTimeframe,
        });

        const cache = indCacheRef.current;
        let data = cache.get(key);

        if (!data) {
          try {
            const period = ind.params?.period ?? 14;
            if (ind.id === 'ma')      data = await sma(indicatorSource, period);
            else if (ind.id === 'ema') data = await ema(indicatorSource, period);
            else if (ind.id === 'rsi') data = await rsi(indicatorSource, period);
            else {
              try { chart.removeSeries(series); } catch {}
              delete indicatorsSeriesRef.current[ind.id];
              return;
            }
            cache.set(key, data);
          } catch (err) {
            console.error('[IND] worker failed:', ind.id, err);
            try { chart.removeSeries(series); } catch {}
            delete indicatorsSeriesRef.current[ind.id];
            return;
          }
        }

        if (myGen !== indGenRef.current) return;

        try { series.setData(data); } catch (e) {
          console.error('[IND] setData failed:', ind.id, e);
        }
      });

    let cancelled = false;
    (async () => {
      await Promise.allSettled(jobs);
      if (cancelled) return;
      if (ch) chart.subscribeCrosshairMove(ch);
    })();

    return () => {
      cancelled = true;
      if (ch && chart) chart.subscribeCrosshairMove(ch);
    };
  }, [
    activeIndicators,
    indicatorSource,
    preparedData,
    currentCandleType,
    currentInterval,
    currentTimeframe,
    sma, ema, rsi
  ]);

  return (
    <div
      ref={chartContainerRef}
      style={{ position:'absolute', top:0, left:0, right:0, bottom:0, width:'100%', height:'100%' }}
    >
      {isChartLoading && (!chartData?.candles || chartData.candles.length === 0) && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>Загрузка графика...</p>
        </div>
      )}

      {chartData?.error && !isChartLoading && (
        <div className="error-message"><p>{chartData.error}</p></div>
      )}

      {(!chartData || !Array.isArray(chartData.candles) || chartData.candles.length === 0) &&
        !isChartLoading && !chartData?.error && (
        <div className="chart-placeholder">Нет данных для отображения графика.</div>
      )}

      {showTooltip && (
        <ChartTooltip
          data={tooltipData}
          isVisible={tooltipVisible}
          position={tooltipPosition}
          containerRef={chartContainerRef}
        />
      )}
    </div>
  );
});

export default ChartCanvas;
