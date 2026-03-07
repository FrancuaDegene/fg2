// src/components/Results/Chart/ChartCanvas.js
import React, { useEffect, useRef, useMemo, memo } from 'react';
import { LineStyle } from 'lightweight-charts';
import { prepareData } from './utils/chartUtils';
import {
  toNumber,
  resolveSeriesKind,
  normalizeTimeValue,
  registerTimeKeys,
  toEpochSec,
  resolvePriceScaleBorder,
} from './utils/chartTimeUtils';
import ChartTooltip from './ChartTooltip';
import { useChart } from './ChartContext';
import { useChartHover } from './hooks/useChartHover';
import { useIndicatorsEngine } from './useIndicatorsEngine';
import { useLightweightChart } from './hooks/useLightweightChart';
import { useFGTimeNavigation } from './hooks/useFGTimeNavigation';
import { useChartData } from './hooks/useChartData';
import { useChartIndicators } from './hooks/useChartIndicators';

const SERIES_KIND = Object.freeze({
  CANDLES: 'candles',
  LINE: 'line',
});

// 15000 выбрано, чтобы покрыть таймфреймы до 3mth/6mth при interval=5m (~12–13k баров).
const MAX_VIRTUAL_VIEWPORT = 15000;
const INDICATORS_MAX_LOOKBACK = 200;

const ZOOM_IDLE_TIMEOUT = 160;   // ms after wheel/zoom to re-enable hover

// Глобовая статистика по работе графика (для отладки производительности)
if (typeof window !== 'undefined') {
  window.__FG_LWC_STATS__ = window.__FG_LWC_STATS__ || {
    slowSetData: 0,   // сколько раз сделали "медленный" setData (большой slice)
    fastUpdate: 0,    // сколько раз прошёл быстрый путь series.update(lastBar)
    vrSetData: 0,     // сколько раз setData вызывался из виртуализации по скроллу
    lastSlice: 0,     // размер последнего slice, который отдали в setData
    lastVisible: 0,   // сколько баров было видно при последнем vrSetData
  };
}

const ChartCanvas = memo(function ChartCanvas({
  chartData,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  loadMoreHistory: loadMoreHistoryProp,
  isChartLoading,
  isExpanded,
  onHover,
  symbolId,
  prevClose,
  showTooltip = true,
  mode = 'compact',
}) {
  // лёгкий счётчик монтирований для отладки
  if (typeof window !== 'undefined') {
    window.__FG_LWC_HIT__ = (window.__FG_LWC_HIT__ || 0) + 1;
    
  }

  // DEBUG: выносим данные в window, чтобы смотреть из консоли
  if (typeof window !== 'undefined') {
    const rawCandles = Array.isArray(chartData?.candles) ? chartData.candles : [];

    window.__CANDLES__ = rawCandles;
    window.__RAW__ = chartData;

    if (rawCandles.length > 0) {
      const first = rawCandles[0];
      const last = rawCandles[rawCandles.length - 1];
      const firstTs = Number(first?.time);
      const lastTs = Number(last?.time);

      if (Number.isFinite(firstTs) && Number.isFinite(lastTs)) {
        window.__CANDLES_RANGE__ = {
          firstIndex: 0,
          lastIndex: rawCandles.length - 1,
          firstTs,
          lastTs,
          firstIso: new Date(firstTs * 1000).toISOString(),
          lastIso: new Date(lastTs * 1000).toISOString(),
        };

      } else {
        window.__CANDLES_RANGE__ = null;
      }
    } else {
      window.__CANDLES_RANGE__ = null;
    }
  }

  const { activeIndicators, effectiveTimeframe } = useChart();
  const { sma, ema, rsi } = useIndicatorsEngine();

  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const prevCloseLineRef = useRef(null);
  const indicatorsSeriesRef = useRef({});
  const resizeObserverRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const rafIdRef = useRef(null);
  const isZoomingRef = useRef(false);
  const zoomIdleTimerRef = useRef(null);
  const hoverContextRef = useRef({
    byTime: new Map(),
    baseline: null,
    seriesKind: SERIES_KIND.CANDLES,
    symbolId: symbolId || null,
    onHover: typeof onHover === 'function' ? onHover : null,
    lookupList: [],
  });
  const lastTimeRef = useRef(null);
  const fullDataRef = useRef([]);
  const virtualRangeRef = useRef({ fromIdx: 0, toIdx: -1, fromTime: null, toTime: null });
  const virtualRafRef = useRef(null);
  const wasAtRightRef = useRef(false);
  const didInitViewRef = useRef(false);
  const lastRangeTsRef = useRef(0);
  const isVirtualizingRef = useRef(false);
  const isResizingRef = useRef(false);
  const navOwnerEnabled = String(process.env.REACT_APP_FG_NAV_OWNER || '') === '1';

  const indCacheRef = useRef(new Map());
  const indGenRef   = useRef(0);

  // Вид серии (line vs candles) для валидации/инфраструктуры
  const seriesKind = resolveSeriesKind(currentCandleType);

   const normalizedCandles = useMemo(() => {
    const t0 = performance.now();
    const raw = Array.isArray(chartData?.candles) ? chartData.candles : [];
    if (raw.length === 0) {
      const result = { list: [], byTime: new Map(), baseline: null };
      const t1 = performance.now();
      return result;
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
          open,
          high,
          low,
          close,
          volume,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const ta = toEpochSec(a.time);
        const tb = toEpochSec(b.time);
        return ta - tb;
      });

    if (process.env.NODE_ENV !== 'production') {
      const timesPreview = sorted.slice(0, 10).map((item) => toEpochSec(item.time));
      const deltaPreview = [];
      for (let i = 1; i < timesPreview.length; i += 1) {
        const prev = timesPreview[i - 1];
        const curr = timesPreview[i];
        if (Number.isFinite(prev) && Number.isFinite(curr)) {
          deltaPreview.push(curr - prev);
        }
      }
    }

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

    const result = { list: sorted, byTime, baseline };
    const t1 = performance.now();

    return result;
  }, [chartData?.candles]);

  const candleByTime = normalizedCandles.byTime;
  const candleBaseline = normalizedCandles.baseline;
  const indicatorSource = normalizedCandles.list;

  // Мы намеренно оставляем зависимости для инициализации чарта при смене isExpanded.
  useLightweightChart({
    containerRef: chartContainerRef,
    chartInstanceRef,
    seriesRef,
    indicatorsSeriesRef,
    prevCloseLineRef,
    resizeObserverRef,
    lastSizeRef,
    isResizingRef,
    rafIdRef,
    isZoomingRef,
    zoomIdleTimerRef,
    currentCandleType,
    seriesKind,
    isExpanded,
    zoomIdleTimeout: ZOOM_IDLE_TIMEOUT,
  });

  const navMinBarsInView =
    isExpanded && navOwnerEnabled && effectiveTimeframe === '1d' ? 120 : 30;

  useFGTimeNavigation({
    chartInstanceRef,
    containerRef: chartContainerRef,
    enabled: Boolean(isExpanded && navOwnerEnabled),
    debugTag: 'ChartCanvas',
    minBarsInView: navMinBarsInView,
    maxBarsInView: 50000,
  });

  // ���?�?�?�?�'�?�?��� �?���?�?�<�: �?�?��ؐ��/�+���?�?�?
  const preparedData = useMemo(() => {
    const rawCandles = chartData?.candles || [];
    const t0 = performance.now();
    const data =
      Array.isArray(rawCandles) && rawCandles.length > 0
        // важно: готовим данные под конкретный вид currentCandleType,
        // createSeries/useChartData уже знают, как их интерпретировать
        ? prepareData(rawCandles, currentCandleType)
        : [];
    const t1 = performance.now();
    return data;
  }, [chartData?.candles, currentCandleType]);

  const loadMoreHistory = loadMoreHistoryProp || chartData?.loadMoreHistory;

  const _lmTypeRef = useRef(null);
  const _lmType = typeof loadMoreHistory;
  if (process.env.NODE_ENV !== 'production' && _lmTypeRef.current !== _lmType) {
    _lmTypeRef.current = _lmType;
  }

  if (process.env.NODE_ENV !== 'production' && isExpanded === undefined) {
    console.warn('[FG][P0][isExpandedMissing]', new Error().stack);
  }

  useChartData({
    chartInstanceRef,
    chartContainerRef,
    seriesRef,
    preparedData,
    currentInterval,
    currentTimeframe: effectiveTimeframe || currentTimeframe,
    currentCandleType,
    isExpanded,
    symbolId,
    fullDataRef,
    virtualRangeRef,
    virtualRafRef,
    wasAtRightRef,
    didInitViewRef,
    lastTimeRef,
    lastRangeTsRef,
    isVirtualizingRef,
    isResizingRef,
    maxVirtualViewport: MAX_VIRTUAL_VIEWPORT,
    indicatorsMaxLookback: INDICATORS_MAX_LOOKBACK,
    loadMoreHistory,
  });

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
  } = useChartHover({
    chartInstanceRef,
    seriesRef,
    hoverContextRef,
    containerRef: chartContainerRef,
    isZoomingRef,
    showTooltip,
    onHover,
  });


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
      lookupList: indicatorSource,
    };
  }, [
    candleByTime,
    candleBaseline,
    seriesKind,
    symbolId,
    onHover,
    lineBaseline,
    prevClose,
    indicatorSource,
  ]);

 

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

  useChartIndicators({
    chartInstanceRef,
    seriesRef,
    preparedData,
    indicatorSource,
    activeIndicators,
    currentCandleType,
    currentInterval,
    currentTimeframe,
    indicatorsSeriesRef,
    indCacheRef,
    indGenRef,
    sma,
    ema,
    rsi,
  });

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
