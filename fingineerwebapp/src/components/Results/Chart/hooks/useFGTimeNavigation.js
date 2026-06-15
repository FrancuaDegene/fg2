import { useEffect, useRef } from 'react';

const DEFAULT_MIN_BARS_IN_VIEW = 10;
const DEFAULT_MAX_BARS_IN_VIEW = 50000;
const ZOOM_IN_FACTOR = 0.9;
const ZOOM_OUT_FACTOR = 1.1;

const isFiniteRange = (range) =>
  range &&
  Number.isFinite(range.from) &&
  Number.isFinite(range.to) &&
  range.to > range.from;

export const useFGTimeNavigation = ({
  chartInstanceRef,
  containerRef,
  enabled,
  debugTag,
  minBarsInView,
  maxBarsInView,
  modeKey,
  autoFitOnModeChange,
}) => {
  const lastModeKeyRef = useRef(null);

  useEffect(() => {
    if (enabled !== true) return undefined;

    const container = containerRef?.current;
    if (!container) return undefined;
    const resolvedMinBarsInView =
      Number.isFinite(minBarsInView) && minBarsInView > 0
        ? minBarsInView
        : DEFAULT_MIN_BARS_IN_VIEW;
    const resolvedMaxBarsInViewRaw =
      Number.isFinite(maxBarsInView) && maxBarsInView > 0
        ? maxBarsInView
        : DEFAULT_MAX_BARS_IN_VIEW;
    const resolvedMaxBarsInView = Math.max(resolvedMinBarsInView, resolvedMaxBarsInViewRaw);

    const readTimeScale = () => {
      const chart = chartInstanceRef?.current;
      if (!chart || typeof chart.timeScale !== 'function') return null;
      return chart.timeScale();
    };

    const hasTimeScaleApi = (ts) =>
      ts &&
      typeof ts.coordinateToLogical === 'function' &&
      typeof ts.getVisibleLogicalRange === 'function' &&
      typeof ts.setVisibleLogicalRange === 'function';

    const toLocalX = (event) => {
      const rect = container.getBoundingClientRect();
      return event.clientX - rect.left;
    };

    const toLogical = (ts, x) => {
      const logical = ts.coordinateToLogical(x);
      return Number.isFinite(logical) ? logical : null;
    };

    let dragging = false;
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartRange = null;
    let pendingX = null;
    let rafId = 0;
    let normalizePostInitRafId = 0;
    let modeChangeHealRafId = 0;

    const normalizeInitialRange = () => {
      const ts = readTimeScale();
      if (!hasTimeScaleApi(ts)) return;

      const currentRange = ts.getVisibleLogicalRange();
      if (!isFiniteRange(currentRange)) return;

      const currentWidth = currentRange.to - currentRange.from;
      if (!Number.isFinite(currentWidth) || currentWidth >= resolvedMinBarsInView) return;

      const center = (currentRange.from + currentRange.to) / 2;
      const half = resolvedMinBarsInView / 2;
      const nextRange = {
        from: center - half,
        to: center + half,
      };

      if (!isFiniteRange(nextRange)) return;
      ts.setVisibleLogicalRange(nextRange);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[FG][NAV] normalizeInitialRange', { debugTag });
      }
    };

    const applyPan = (x) => {
      const ts = readTimeScale();
      if (!hasTimeScaleApi(ts) || !isFiniteRange(dragStartRange)) return;

      const startLogical = toLogical(ts, dragStartX);
      const currentLogical = toLogical(ts, x);
      if (!Number.isFinite(startLogical) || !Number.isFinite(currentLogical)) return;

      const delta = startLogical - currentLogical;
      const nextRange = {
        from: dragStartRange.from + delta,
        to: dragStartRange.to + delta,
      };

      if (!isFiniteRange(nextRange)) return;
      ts.setVisibleLogicalRange(nextRange);
    };

    const stopDragging = (event) => {
      if (event && activePointerId != null && event.pointerId !== activePointerId) return;

      dragging = false;
      dragStartRange = null;
      pendingX = null;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      if (activePointerId != null && typeof container.releasePointerCapture === 'function') {
        try {
          container.releasePointerCapture(activePointerId);
        } catch {}
      }

      activePointerId = null;
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;

      const ts = readTimeScale();
      if (!hasTimeScaleApi(ts)) return;

      const range = ts.getVisibleLogicalRange();
      if (!isFiniteRange(range)) return;

      dragging = true;
      activePointerId = event.pointerId;
      dragStartX = toLocalX(event);
      dragStartRange = { from: range.from, to: range.to };
      pendingX = dragStartX;

      if (typeof container.setPointerCapture === 'function') {
        try {
          container.setPointerCapture(activePointerId);
        } catch {}
      }
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      if (activePointerId != null && event.pointerId !== activePointerId) return;

      pendingX = toLocalX(event);
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (!dragging || !Number.isFinite(pendingX)) return;
        applyPan(pendingX);
      });
    };

    const onWheel = (event) => {
      const ts = readTimeScale();
      if (!hasTimeScaleApi(ts)) return;
      if (dragging) return;

      event.preventDefault();

      const currentRange = ts.getVisibleLogicalRange();
      if (!isFiniteRange(currentRange)) return;

      const cursorX = toLocalX(event);
      const anchorLogical = toLogical(ts, cursorX);
      const anchor = Number.isFinite(anchorLogical)
        ? anchorLogical
        : (currentRange.from + currentRange.to) / 2;

      const factor = event.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
      if (!Number.isFinite(factor) || factor <= 0) return;

      const currentWidth = currentRange.to - currentRange.from;
      if (!Number.isFinite(currentWidth) || currentWidth <= 0) return;

      const leftPart = anchor - currentRange.from;
      const rightPart = currentRange.to - anchor;
      let nextLeft = leftPart * factor;
      let nextRight = rightPart * factor;
      let nextWidth = nextLeft + nextRight;

      const anchorRatio = currentWidth > 0 ? leftPart / currentWidth : 0.5;
      if (nextWidth < resolvedMinBarsInView) {
        nextWidth = resolvedMinBarsInView;
        nextLeft = nextWidth * anchorRatio;
        nextRight = nextWidth - nextLeft;
      } else if (nextWidth > resolvedMaxBarsInView) {
        nextWidth = resolvedMaxBarsInView;
        nextLeft = nextWidth * anchorRatio;
        nextRight = nextWidth - nextLeft;
      }

      const nextRange = {
        from: anchor - nextLeft,
        to: anchor + nextRight,
      };

      if (!isFiniteRange(nextRange)) return;
      const EPS = 0.001;
      const targetWidth = nextWidth;
      const safeCenter = Number.isFinite(anchor)
        ? anchor
        : (currentRange.from + currentRange.to) / 2;

      const applyHeal = () => {
        const half = resolvedMinBarsInView / 2;
        const healRange = {
          from: safeCenter - half,
          to: safeCenter + half,
        };
        if (!isFiniteRange(healRange)) return null;
        ts.setVisibleLogicalRange(healRange);
        const afterHeal = ts.getVisibleLogicalRange();
        return isFiniteRange(afterHeal) ? afterHeal : healRange;
      };

      ts.setVisibleLogicalRange(nextRange);
      const appliedRange = ts.getVisibleLogicalRange();
      if (!isFiniteRange(appliedRange)) return;

      const requestedWidth = nextRange.to - nextRange.from;
      const appliedWidth = appliedRange.to - appliedRange.from;
      let finalRange = appliedRange;
      let reason = null;

      // Heal only on hard collapse below minBarsInView.
      if (appliedWidth < resolvedMinBarsInView) {
        const healed = applyHeal();
        if (healed) {
          finalRange = healed;
          reason = 'heal';
        }
      } else {
        const hitLeftEdge = appliedRange.from > nextRange.from + EPS;
        const hitRightEdge = appliedRange.to < nextRange.to - EPS;
        const needsShift = appliedWidth < targetWidth || hitLeftEdge || hitRightEdge;

        if (needsShift) {
          let shiftedRange = null;
          const leftDelta = hitLeftEdge ? appliedRange.from - nextRange.from : 0;
          const rightDelta = hitRightEdge ? nextRange.to - appliedRange.to : 0;

          if (hitLeftEdge && (!hitRightEdge || leftDelta >= rightDelta)) {
            shiftedRange = {
              from: appliedRange.from,
              to: appliedRange.from + targetWidth,
            };
            reason = 'shift-left';
          } else if (hitRightEdge) {
            shiftedRange = {
              from: appliedRange.to - targetWidth,
              to: appliedRange.to,
            };
            reason = 'shift-right';
          }

          if (shiftedRange && isFiniteRange(shiftedRange)) {
            ts.setVisibleLogicalRange(shiftedRange);
            const afterShift = ts.getVisibleLogicalRange();
            finalRange = isFiniteRange(afterShift) ? afterShift : shiftedRange;

            // Heal only if post-shift still below minBarsInView.
            const finalWidthAfterShift =
              isFiniteRange(finalRange) ? finalRange.to - finalRange.from : 0;
            if (finalWidthAfterShift < resolvedMinBarsInView) {
              const healed = applyHeal();
              if (healed) {
                finalRange = healed;
                reason = 'heal';
              }
            }
          }
        }
      }

      if (process.env.NODE_ENV !== 'production' && reason) {
        const finalWidth =
          isFiniteRange(finalRange) ? finalRange.to - finalRange.from : null;
        console.debug('[FG][NAV][WHEEL_FIX]', {
          reason,
          anchor,
          factor,
          requestedRange: nextRange,
          requestedWidth,
          appliedRange,
          appliedWidth,
          finalRange,
          finalWidth,
        });
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', stopDragging);
    container.addEventListener('pointercancel', stopDragging);
    container.addEventListener('lostpointercapture', stopDragging);
    container.addEventListener('wheel', onWheel, { passive: false });

    const hasPrevMode = lastModeKeyRef.current != null;
    const modeChanged = Boolean(modeKey) && lastModeKeyRef.current !== modeKey;

    // first mount: remember modeKey only (do not touch range/fit)
    if (modeKey && !hasPrevMode) {
      lastModeKeyRef.current = modeKey;
    } else if (modeChanged) {
      lastModeKeyRef.current = modeKey;
      const ts = readTimeScale();
      if (hasTimeScaleApi(ts)) {
        if (autoFitOnModeChange && typeof ts.fitContent === 'function') {
          try {
            ts.fitContent();
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[FG][NAV] fitContent failed', { debugTag, modeKey, err });
            }
          }
        }

        // do not call normalizeInitialRange twice; common call below handles it
        modeChangeHealRafId = requestAnimationFrame(() => {
          modeChangeHealRafId = 0;
          const ts2 = readTimeScale();
          if (!hasTimeScaleApi(ts2)) return;
          const currentRange = ts2.getVisibleLogicalRange?.();
          if (!isFiniteRange(currentRange)) return;

          const width = currentRange.to - currentRange.from;
          if (!Number.isFinite(width) || width >= resolvedMinBarsInView) return;

          ts2.setVisibleLogicalRange({
            from: currentRange.to - resolvedMinBarsInView,
            to: currentRange.to,
          });

          if (process.env.NODE_ENV !== 'production') {
            console.debug('[FG][NAV] healOnModeChange', { debugTag, modeKey });
          }
        });
      }
    }

    normalizeInitialRange();
    normalizePostInitRafId = requestAnimationFrame(() => {
      normalizePostInitRafId = 0;
      const ts = readTimeScale();
      if (!hasTimeScaleApi(ts)) return;

      const currentRange = ts.getVisibleLogicalRange();
      if (!isFiniteRange(currentRange)) return;

      const width = currentRange.to - currentRange.from;
      if (!Number.isFinite(width) || width >= resolvedMinBarsInView) return;

      const center = (currentRange.from + currentRange.to) / 2;
      const half = resolvedMinBarsInView / 2;
      const nextRange = {
        from: center - half,
        to: center + half,
      };

      if (!isFiniteRange(nextRange)) return;
      ts.setVisibleLogicalRange(nextRange);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[FG][NAV] normalizePostInit', {
          debugTag,
          width,
          from: currentRange.from,
          to: currentRange.to,
        });
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[FG][NAV] attached', { debugTag });
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (normalizePostInitRafId) {
        cancelAnimationFrame(normalizePostInitRafId);
        normalizePostInitRafId = 0;
      }
      if (modeChangeHealRafId) {
        cancelAnimationFrame(modeChangeHealRafId);
        modeChangeHealRafId = 0;
      }

      dragging = false;
      dragStartRange = null;
      pendingX = null;
      activePointerId = null;

      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', stopDragging);
      container.removeEventListener('pointercancel', stopDragging);
      container.removeEventListener('lostpointercapture', stopDragging);
      container.removeEventListener('wheel', onWheel, { passive: false });

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[FG][NAV] detached', { debugTag });
      }
    };
  }, [chartInstanceRef, containerRef, enabled, debugTag, minBarsInView, maxBarsInView, modeKey, autoFitOnModeChange]);
};
