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
    const navOwnerEnabled = String(process.env.REACT_APP_FG_NAV_OWNER || '') === '1';
    const disableNativeNavigation = isExpanded && navOwnerEnabled;

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
      handleScale: disableNativeNavigation
        ? {
            mouseWheel: false,
            pinch: false,
            axisPressedMouseMove: false,
            axisDoubleClickReset: false,
            mouseWheelSensitivity: 0.15,
          }
        : {
            mouseWheel: true,
            pinch: true,
            axisPressedMouseMove: true,
            axisDoubleClickReset: true,
            mouseWheelSensitivity: 0.15,
          },
      // Compact = snapshot: пан разрешён (для просмотра внутри окна), границы фиксируются в useChartData.
      handleScroll: disableNativeNavigation
        ? { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false }
        : { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
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
    const vpWriterRestoreFns = [];
    if (process.env.NODE_ENV !== 'production' && timeScale) {
      const logThrottleMs = 1000;
      const lastLogAtByMethod = new Map();
      const snapshotVp = () => {
        let logicalRange = null;
        let timeRange = null;
        let barSpacing = null;
        try {
          logicalRange =
            typeof timeScale.getVisibleLogicalRange === 'function'
              ? timeScale.getVisibleLogicalRange()
              : null;
        } catch {}
        try {
          timeRange =
            typeof timeScale.getVisibleRange === 'function'
              ? timeScale.getVisibleRange()
              : null;
        } catch {}
        try {
          const opts =
            typeof timeScale.options === 'function'
              ? timeScale.options()
              : null;
          if (opts && Object.prototype.hasOwnProperty.call(opts, 'barSpacing')) {
            barSpacing = opts.barSpacing;
          }
        } catch {}
        const logicalWidth =
          logicalRange &&
          Number.isFinite(logicalRange.from) &&
          Number.isFinite(logicalRange.to)
            ? logicalRange.to - logicalRange.from
            : null;
        return {
          logicalRange,
          timeRange,
          barSpacing,
          logicalWidth,
        };
      };
      const wrapVpWriter = (methodName) => {
        const original = timeScale[methodName];
        if (typeof original !== 'function') return;
        const wrapped = (...args) => {
          const now =
            typeof performance !== 'undefined' && typeof performance.now === 'function'
              ? performance.now()
              : Date.now();
          const key = methodName;
          const prev = lastLogAtByMethod.get(key) ?? -Infinity;
          const shouldLog = now - prev >= logThrottleMs;
          if (shouldLog) {
            lastLogAtByMethod.set(key, now);
          }
          const pre = shouldLog ? snapshotVp() : null;
          if (shouldLog) {
            console.debug(`[FG][VP][PRE] ${methodName}`, { args, ...pre });
          }
          const result = original.apply(timeScale, args);
          if (!shouldLog) {
            return result;
          }
          const post = snapshotVp();
          console.debug(`[FG][VP][POST] ${methodName}`, { args, ...post });
          const isAnomaly =
            (post.logicalWidth != null && post.logicalWidth < 5) ||
            (post.barSpacing != null && post.barSpacing > 80);
          if (isAnomaly) {
            console.debug(`[FG][VP][POST][ANOMALY] ${methodName}`, {
              args,
              pre,
              post,
            });
            console.trace(`[FG][VP][POST][ANOMALY][TRACE] ${methodName}`);
          }
          return result;
        };
        try {
          timeScale[methodName] = wrapped;
          vpWriterRestoreFns.push(() => {
            if (timeScale[methodName] === wrapped) {
              timeScale[methodName] = original;
            }
          });
        } catch {}
      };
      wrapVpWriter('setVisibleLogicalRange');
      wrapVpWriter('setVisibleRange');
      wrapVpWriter('applyOptions');
    }
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
          if (disableNativeNavigation) {
          } else {
            ts.applyOptions({ rightOffset: 0 });
            ts.scrollToRealTime();
          }
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
      vpWriterRestoreFns.forEach((restore) => {
        try {
          restore();
        } catch {}
      });
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}
    };
  }, [isExpanded, currentCandleType, zoomIdleTimeout]);
};
