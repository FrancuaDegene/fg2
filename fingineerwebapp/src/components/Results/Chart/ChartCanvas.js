// src/components/Results/Chart/ChartCanvas.js
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  memo,
} from 'react';
import { createChart } from 'lightweight-charts';
import { calculateBarSpacing, createSeries, prepareData } from './utils/chartUtils';
import ActiveIndicators from './ActiveIndicators';
import ChartTooltip from './ChartTooltip';
import { useChart } from './ChartContext';
import { useIndicatorsEngine } from './useIndicatorsEngine';

const ChartCanvas = memo(function ChartCanvas({
  chartData,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  isChartLoading,
  isExpanded,
}) {
  const { activeIndicators } = useChart();
  const { sma, ema, rsi } = useIndicatorsEngine();

  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const indicatorsSeriesRef = useRef({});
  const resizeObserverRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const rafIdRef = useRef(null);
  const crosshairHandlerRef = useRef(null);

  const indCacheRef = useRef(new Map());
  const indGenRef   = useRef(0);

  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Мы намеренно оставляем []: компонент ремонтируется по key при смене isExpanded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const layoutOptions = isExpanded
      ? { textColor: '#6d768a', background: { type: 'solid', color: '#ffffff' } }
      : { textColor: '#d1d4dc', background: { type: 'solid', color: '#131722' } };

    const gridOptions = isExpanded
      ? { vertLines: { color: 'rgba(210, 218, 233, 0.35)' }, horzLines: { color: 'rgba(210, 218, 233, 0.28)' } }
      : { vertLines: { color: 'rgba(42, 46, 57, 0.18)' },  horzLines: { color: 'rgba(42, 46, 57, 0.18)' } };

    const priceScaleOptions = isExpanded
      ? { visible: true, borderVisible: false, borderColor: 'rgba(210, 218, 233, 0.35)', autoScale: true, scaleMargins: { top: 0.08, bottom: 0.08 }, textColor: '#6d768a' }
      : { visible: true, borderVisible: false, borderColor: 'transparent', autoScale: true, scaleMargins: { top: 0.1, bottom: 0.1 } };

    const chart = createChart(container, {
      layout: layoutOptions,
      grid: gridOptions,
      width: container.clientWidth,
      height: container.clientHeight,
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: true, mouseWheelSensitivity: 0.3 },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      timeScale: { timeVisible: true, borderVisible: false, borderColor: 'transparent', fixLeftEdge: true, fixRightEdge: true, rightOffset: 12, minBarSpacing: 0.5, barSpacing: 6 },
      crosshair: { mode: 0 },
      rightPriceScale: priceScaleOptions,
      leftPriceScale: { visible: false },
    });

    chartInstanceRef.current = chart;

    const handleCrosshairMove = (param) => {
      if (param.time && param.point && param.seriesData.size > 0 && seriesRef.current) {
        const seriesData = param.seriesData.get(seriesRef.current);
        if (seriesData) {
          setTooltipData({
            time: seriesData.time, open: seriesData.open, high: seriesData.high,
            low: seriesData.low, close: seriesData.close, volume: seriesData.volume,
          });
          setTooltipPosition({ x: param.point.x, y: param.point.y });
          setTooltipVisible(true);
          return;
        }
      }
      setTooltipVisible(false);
    };
    crosshairHandlerRef.current = handleCrosshairMove;
    chart.subscribeCrosshairMove(handleCrosshairMove);

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
        try { chart.removeSeries(seriesRef.current); } catch {}
        seriesRef.current = null;
      }

      // отписка кроссхейра
      try {
        if (crosshairHandlerRef.current) {
          chart.unsubscribeCrosshairMove(crosshairHandlerRef.current);
        }
      } catch {}
      crosshairHandlerRef.current = null;

      // удаление чарта
      try { chart.remove(); } catch {}
      chartInstanceRef.current = null;
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
      borderVisible: false,
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

  // базовая серия
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      try { seriesRef.current.setData([]); } catch {}
      try { chart.removeSeries(seriesRef.current); } catch (error) {
        console.warn('Could not remove series', error);
      }
      seriesRef.current = null;
    }

    seriesRef.current = createSeries(chart, currentCandleType);
    try { seriesRef.current.setData([]); } catch {}

    try {
      if (preparedData.length > 0) {
        seriesRef.current.setData(preparedData);
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
  }, [currentCandleType, currentInterval, currentTimeframe, preparedData]);

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

    if (!preparedData || preparedData.length === 0) {
      if (ch) chart.subscribeCrosshairMove(ch);
      return;
    }

    const jobs = (activeIndicators || [])
      .filter((ind) => ind && ind.visible !== false)
      .map(async (ind) => {
        const series = chart.addLineSeries({
          color: ind.color || (ind.id === 'rsi' ? 'orange' : ind.id === 'ma' ? 'blue' : 'green'),
          lineWidth: 2,
          priceScaleId: 'right',
        });
        try { series.setData([]); } catch {}
        indicatorsSeriesRef.current[ind.id] = series;

        const key = JSON.stringify({
          id: ind.id,
          params: ind.params || {},
          len: preparedData.length,
          candleType: currentCandleType,
          interval: currentInterval,
          timeframe: currentTimeframe,
        });

        const cache = indCacheRef.current;
        let data = cache.get(key);

        if (!data) {
          try {
            const period = ind.params?.period ?? 14;
            if (ind.id === 'ma')      data = await sma(preparedData, period);
            else if (ind.id === 'ema') data = await ema(preparedData, period);
            else if (ind.id === 'rsi') data = await rsi(preparedData, period);
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
      <ActiveIndicators />

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

      <ChartTooltip
        data={tooltipData}
        isVisible={tooltipVisible}
        position={tooltipPosition}
        containerRef={chartContainerRef}
      />
    </div>
  );
});

export default ChartCanvas;
