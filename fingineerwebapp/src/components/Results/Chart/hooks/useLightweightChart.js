import { useLayoutEffect } from 'react';
import { createChart } from 'lightweight-charts';
import { resolvePriceScaleBorder } from '../utils/chartTimeUtils';
import { createSeries } from '../utils/chartUtils';

export const useLightweightChart = ({
  containerRef,
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
  zoomIdleTimeout,
}) => {
  useLayoutEffect(() => {
    const container = containerRef.current;
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
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
        mouseWheelSensitivity: 0.15,
      },
      // Compact = snapshot: пан разрешён (для просмотра внутри окна), границы фиксируются в useChartData.
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      timeScale: {
        timeVisible: true,
        borderVisible: false,
        borderColor: 'transparent',
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 12,
        minBarSpacing: 0.5,
        barSpacing: 6,
        tickMarkFormatter: (time) =>
          new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Europe/Moscow',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(time * 1000)),
      },
      crosshair: {
        mode: 0,
        vertLine: { labelVisible: isExpanded },
        horzLine: { labelVisible: true },
      },
      rightPriceScale: priceScaleOptions,
      leftPriceScale: { visible: false },
    });

    chartInstanceRef.current = chart;

    // создаём серию строго по текущему типу графика
    const baseSeries = createSeries(chart, currentCandleType);
    seriesRef.current = baseSeries;

    if (process.env.NODE_ENV !== 'production') {
      // полезно видеть, какой тип реально создаётся
      console.log('[FG][useLightweightChart] seriesKind', seriesKind, 'currentCandleType', currentCandleType);
    }

    const timeScale = chart.timeScale();
    const handleRangeChange = () => {
      isZoomingRef.current = true;
      if (zoomIdleTimerRef.current) {
        clearTimeout(zoomIdleTimerRef.current);
      }
      zoomIdleTimerRef.current = setTimeout(() => {
        isZoomingRef.current = false;
      }, zoomIdleTimeout);
    };
    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;

      const width = Math.max(0, Math.ceil(rect.width));
      const height = Math.max(0, Math.ceil(rect.height));

      if (width === 0 || height === 0) return;
      if (width === lastSizeRef.current.width && height === lastSizeRef.current.height) return;

      lastSizeRef.current.width = width;
      lastSizeRef.current.height = height;
      isResizingRef.current = true;

      try {
        resizeObserver.unobserve(container);
      } catch {}

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        try {
          chart.resize(width, height);
          const ts = chart.timeScale();
          ts.applyOptions({ rightOffset: 0 });
          ts.scrollToRealTime();
        } catch (error) {
          console.warn('Chart resize error:', error);
        } finally {
          rafIdRef.current = null;
          isResizingRef.current = false;
          try {
            resizeObserver.observe(container);
          } catch {}
        }
      });
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {}
        resizeObserverRef.current = null;
      }
      isResizingRef.current = false;

      Object.values(indicatorsSeriesRef.current).forEach((series) => {
        try {
          series.setData([]);
        } catch {}
        try {
          chart.removeSeries(series);
        } catch {}
      });
      indicatorsSeriesRef.current = {};

      if (seriesRef.current) {
        try {
          seriesRef.current.setData([]);
        } catch {}
        try {
          if (prevCloseLineRef.current) {
            seriesRef.current.removePriceLine(prevCloseLineRef.current);
          }
        } catch {}
        try {
          chart.removeSeries(seriesRef.current);
        } catch {}
        seriesRef.current = null;
        prevCloseLineRef.current = null;
      }

      try {
        chart.remove();
      } catch {}
      chartInstanceRef.current = null;
      isZoomingRef.current = false;
      if (zoomIdleTimerRef.current) {
        clearTimeout(zoomIdleTimerRef.current);
        zoomIdleTimerRef.current = null;
      }
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}
    };
  }, [isExpanded, currentCandleType, zoomIdleTimeout]);
};
