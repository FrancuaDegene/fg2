// src/components/Results/Chart/hooks/useChartHover.js
import { useEffect, useRef, useState } from 'react';
import {
  normalizeTimeValue,
  toTimestampMs,
  toNumber,
} from '../utils/chartTimeUtils';

const SERIES_KIND = Object.freeze({
  CANDLES: 'candles',
  LINE: 'line',
});

const FPS_LIMIT_MS = 1000 / 30; // ~33ms cap for crosshair updates

export function useChartHover({
  chartInstanceRef,
  seriesRef,
  hoverContextRef,
  containerRef,
  isZoomingRef,
  showTooltip,
  onHover,
}) {
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const hoverLeaveTimerRef = useRef(null);
  const crosshairHandlerRef = useRef(null);
  const lastFrameTsRef = useRef(0);
  const lastCrosshairRef = useRef({
    time: null,
    x: null,
    y: null,
  });

  useEffect(() => {
    const chart = chartInstanceRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

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
      if (isZoomingRef?.current) {
        const hoverCtx = hoverContextRef.current;
        if (hoverCtx?.onHover) {
          hoverCtx.onHover(null);
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
      const emitHover = hoverCtx?.onHover;
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
            setTooltipVisible(!!showTooltip);
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

    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
        hoverLeaveTimerRef.current = null;
      }

      if (crosshairHandlerRef.current) {
        try {
          chart.unsubscribeCrosshairMove(crosshairHandlerRef.current);
        } catch {}
      }

      crosshairHandlerRef.current = null;
      lastCrosshairRef.current = { time: null, x: null, y: null };
    };
  }, [chartInstanceRef, seriesRef, hoverContextRef, isZoomingRef, showTooltip, onHover, containerRef]);

  return {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
  };
}
