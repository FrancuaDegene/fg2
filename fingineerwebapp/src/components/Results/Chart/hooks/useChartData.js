import { useEffect, useRef } from 'react';
import {
  clamp,
  binSearchByTime,
  TF_SECONDS,
  toEpochSec,
  toNumber,
  resolveSeriesKind,
} from '../utils/chartTimeUtils';

function isValidBar(bar, candleType) {
  if (!bar) return false;

  const seriesKind = resolveSeriesKind(candleType);
  const t = toNumber(bar.time);
  if (!Number.isFinite(t)) return false;

  if (seriesKind === 'candles') {
    const o = toNumber(bar.open);
    const h = toNumber(bar.high);
    const l = toNumber(bar.low);
    const c = toNumber(bar.close);

    return (
      Number.isFinite(o) &&
      Number.isFinite(h) &&
      Number.isFinite(l) &&
      Number.isFinite(c)
    );
  }

  const v = toNumber(bar.value !== undefined ? bar.value : bar.close);
  return Number.isFinite(v);
}

function filterValidBars(list, candleType, contextLabel) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const safe = [];
  let badCount = 0;
  let firstBad = null;

  for (const bar of list) {
    if (isValidBar(bar, candleType)) {
      safe.push(bar);
    } else {
      badCount += 1;
      if (!firstBad) firstBad = bar;
    }
  }

  if (badCount > 0 && typeof console !== 'undefined') {
    console.warn(
      `[FG][useChartData] Dropped ${badCount} invalid bars in ${contextLabel}. Sample:`,
      firstBad,
    );
  }

  return safe;
}

function clearCrosshairSafely(chart) {
  if (!chart || typeof chart.clearCrosshairPosition !== 'function') return;
  try {
    chart.clearCrosshairPosition();
  } catch {}
}

function summarizeSeriesData(data) {
  const list = Array.isArray(data) ? data : [];
  const times = list.map((bar) => bar?.time);
  const numericTimes = times
    .map((time) => (typeof time === 'object' ? Number(time?.timestamp) : Number(time)))
    .filter(Number.isFinite);
  let duplicateTimeCount = 0;
  const seen = new Set();
  numericTimes.forEach((time) => {
    if (seen.has(time)) duplicateTimeCount += 1;
    seen.add(time);
  });

  return {
    length: list.length,
    firstTime: times[0] ?? null,
    lastTime: times[times.length - 1] ?? null,
    firstTimeType: times[0] === null || times[0] === undefined ? null : typeof times[0],
    lastTimeType: times[times.length - 1] === null || times[times.length - 1] === undefined
      ? null
      : typeof times[times.length - 1],
    hasMsTime: numericTimes.some((time) => time > 1e12),
    isSorted: numericTimes.every((time, index) => index === 0 || numericTimes[index - 1] <= time),
    duplicateTimeCount,
    sampleFirst3Times: times.slice(0, 3),
    sampleLast3Times: times.slice(-3),
  };
}

function writeDataPathDiagnostic(path, data, context = {}) {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;

  try {
    const entry = {
      path,
      ...summarizeSeriesData(data),
      ...context,
      ts: Date.now(),
    };
    window.__FG_94_DATA_PATH_DIAG__ = {
      ...(window.__FG_94_DATA_PATH_DIAG__ || {}),
      [path]: entry,
    };
  } catch {}
}

export const useChartData = ({
  chartInstanceRef,
  chartContainerRef,
  seriesRef,
  preparedData,
  payloadVersion,
  loadMoreHistory,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  symbolId,
  fullDataRef,
  virtualRangeRef,
  virtualRafRef,
  wasAtRightRef,
  didInitViewRef,
  activePriceSliceRef,
  lastTimeRef,
  lastRangeTsRef,
  isVirtualizingRef,
  isResizingRef,
  maxVirtualViewport,
  indicatorsMaxLookback,
  isExpanded,
  selectedDate,
}) => {
  const isLoadingMoreRef = useRef(false);
  const prevRangeRef = useRef(null);
  const lastLoadMoreAtRef = useRef(0);
  const lastLoadMoreKeyRef = useRef(null);
  const lastAppliedRangeRef = useRef({ from: null, to: null });
  const snapshotRangeRef = useRef(null);
  const isClampingRef = useRef(false);
  const lastPreparedDataRef = useRef(null);
  const lastSelectionKeyRef = useRef(null);
  const selectionVersionRef = useRef(0);
  const staleInitPassIdRef = useRef(0);
  const lastDeferredInitTraceRef = useRef(null);
  const skipTinySliceLoggedRef = useRef(new Set());
  const skipOwnerNavLoggedRef = useRef(new Set());
  const MIN_VISIBLE_FOR_LOAD = 5;
  const MAX_VISIBLE_FOR_LOAD = 120;
  const LEFT_EDGE_THRESHOLD = 5;
  const COLLAPSED_LOGICAL_WIDTH = 2;
  const resolvedIsExpanded = Boolean(isExpanded);
  const navOwnerEnabled = String(process.env.REACT_APP_FG_NAV_OWNER || '') === '1';
  const staleInitTraceEnabled =
    process.env.NODE_ENV !== 'production' &&
    (
      String(process.env.VITE_FG_DEBUG_PANEL || '') === '1' ||
      String(process.env.REACT_APP_FG_DEBUG_PANEL || '') === '1'
    );

  const getPreparedTraceMeta = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      return {
        preparedLen: 0,
        firstTime: null,
        lastTime: null,
      };
    }

    return {
      preparedLen: list.length,
      firstTime: toNumber(list[0]?.time),
      lastTime: toNumber(list[list.length - 1]?.time),
    };
  };

  const pushStaleInitTrace = (payload) => {
    if (!staleInitTraceEnabled || typeof window === 'undefined') return;

    try {
      const nextEntry = {
        ts: Date.now(),
        ...payload,
      };
      const prev = Array.isArray(window.__FG_STALE_INIT_TRACE__)
        ? window.__FG_STALE_INIT_TRACE__
        : [];
      const next = prev.length >= 120
        ? [...prev.slice(prev.length - 119), nextEntry]
        : [...prev, nextEntry];
      window.__FG_STALE_INIT_TRACE__ = next;
      console.debug('[FG][STALE_INIT_TRACE]', nextEntry);
    } catch {}
  };

  // При смене тикера/интервала/таймфрейма/типа свечей сбрасываем стрим-refs и виртуализацию.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    lastTimeRef.current = null;
    didInitViewRef.current = false;

    fullDataRef.current = [];
    virtualRangeRef.current = {
      fromIdx: 0,
      toIdx: -1,
      fromTime: null,
      toTime: null,
    };

    wasAtRightRef.current = false;
    isVirtualizingRef.current = false;
    lastRangeTsRef.current = 0;
    snapshotRangeRef.current = null;

    if (virtualRafRef.current) {
      try {
        cancelAnimationFrame(virtualRafRef.current);
      } catch {}
      virtualRafRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolId, currentInterval, currentTimeframe, currentCandleType]);

  // NOTE: refs (chartInstanceRef, seriesRef, chartContainerRef, ...) .   .
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const chart = chartInstanceRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const selectionKey = `${symbolId || 'nosymbol'}|${currentTimeframe}|${currentInterval}|${currentCandleType}`;
    const selectionChanged = lastSelectionKeyRef.current !== selectionKey;
    const preparedDataUnchanged = lastPreparedDataRef.current === preparedData;
    const isStaleSelectionPass = selectionChanged && preparedDataUnchanged;
    if (selectionChanged) {
      selectionVersionRef.current += 1;
    }
    if (selectionVersionRef.current === 0) {
      selectionVersionRef.current = 1;
    }
    const selectionVersion = selectionVersionRef.current;
    const passId = staleInitPassIdRef.current + 1;
    staleInitPassIdRef.current = passId;
    const didInitViewBefore = Boolean(didInitViewRef.current);
    const preparedTraceMeta = getPreparedTraceMeta(preparedData);
    lastSelectionKeyRef.current = selectionKey;
    lastPreparedDataRef.current = preparedData;
    if (
      lastDeferredInitTraceRef.current &&
      lastDeferredInitTraceRef.current.selectionVersion !== selectionVersion
    ) {
      lastDeferredInitTraceRef.current = null;
    }
    const activePendingInitToken =
      lastDeferredInitTraceRef.current &&
      lastDeferredInitTraceRef.current.selectionVersion === selectionVersion
        ? lastDeferredInitTraceRef.current
        : null;

    pushStaleInitTrace({
      event: 'passStart',
      passId,
      selectionKey,
      selectionVersion,
      payloadVersion,
      selectionChanged,
      preparedDataUnchanged,
      preparedLen: preparedTraceMeta.preparedLen,
      firstTime: preparedTraceMeta.firstTime,
      lastTime: preparedTraceMeta.lastTime,
      didInitViewBefore,
      didInitViewAfter: didInitViewBefore,
      deferTaken: false,
      completionKind: null,
      rangeAction: null,
    });

    if (!preparedData || preparedData.length === 0) {
      if (virtualRafRef.current) cancelAnimationFrame(virtualRafRef.current);
      try {
        clearCrosshairSafely(chartInstanceRef.current);
        if (activePriceSliceRef) activePriceSliceRef.current = [];
        series.setData([]);
      } catch {}

      fullDataRef.current = [];
      virtualRangeRef.current = {
        fromIdx: 0,
        toIdx: -1,
        fromTime: null,
        toTime: null,
      };
      wasAtRightRef.current = false;
      lastTimeRef.current = null;
      didInitViewRef.current = false;
      return;
    }

    const candleType = currentCandleType;
    const lastBar = preparedData[preparedData.length - 1];
    let lastTs = null;

    if (!isValidBar(lastBar, candleType)) {
      console.warn(
        '[FG][useChartData] Skip fast-path update: invalid lastBar',
        lastBar,
      );
    } else {
      lastTs = toEpochSec(lastBar?.time);
      const prevTs = lastTimeRef.current;
      const isStream =
        prevTs !== null && lastTs !== null && lastTs >= prevTs;

      if (isStream) {
        const secMap = {
          '1m': 60,
          '5m': 300,
          '15m': 900,
          '30m': 1800,
          '1h': 3600,
          '1d': 86400,
        };
        const intervalSec = secMap[currentInterval] || 60;
        const contiguous = lastTs - prevTs <= intervalSec * 2;

        if (contiguous && !activePendingInitToken) {
          try {
            if (
              typeof window !== 'undefined' &&
              window.__FG_LWC_STATS__
            ) {
              window.__FG_LWC_STATS__.fastUpdate += 1;
            }
            series.update(lastBar);
            if (activePriceSliceRef) {
              const currentSlice = Array.isArray(activePriceSliceRef.current)
                ? activePriceSliceRef.current
                : [];
              const lastIndex = currentSlice.length - 1;
              const lastSliceTime = lastIndex >= 0
                ? toEpochSec(currentSlice[lastIndex]?.time)
                : null;
              activePriceSliceRef.current = lastSliceTime === lastTs
                ? [...currentSlice.slice(0, lastIndex), lastBar]
                : [...currentSlice, lastBar];
            }
            lastTimeRef.current = lastTs;
            const ts = chart.timeScale();
            wasAtRightRef.current = ts.scrollPosition?.() === 0;
            if (lastTs > prevTs && wasAtRightRef.current) {
              if (resolvedIsExpanded && navOwnerEnabled) {
              } else {
                ts.scrollToRealTime?.();
              }
            }
          } catch (err) {
            console.warn('[LWC] update failed -> fallback later', err);
          }
          return;
        }
      }
    }

    fullDataRef.current = filterValidBars(preparedData, candleType, 'fullDataRef');
    const full = fullDataRef.current;
    const total = full.length;
    const latestFull = full[total - 1] || null;
    if (latestFull) {
      const tsLatest = toEpochSec(latestFull.time);
      if (tsLatest !== null) lastTs = tsLatest;
    }

    const ts = chart.timeScale();
    const vis = ts.getVisibleRange?.();
    const width = chartContainerRef.current?.clientWidth || 800;

    const tfSec = TF_SECONDS[currentTimeframe];
    const secMap = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '1d': 86400,
    };
    const intervalSec = secMap[currentInterval] || 60;

    const estimateByWidth = clamp(Math.floor(width * 1.5), 800, maxVirtualViewport);
    let estimateByTf = null;

    if (Number.isFinite(tfSec) && Number.isFinite(intervalSec) && intervalSec > 0) {
      const barsForTf = Math.ceil(tfSec / intervalSec);
      estimateByTf = barsForTf; // Без clamp для пресетов
    }

    const windowSize =
      Number.isFinite(tfSec) && estimateByTf != null
        ? estimateByTf
        : estimateByWidth;

    const estimate = windowSize;

    const hasValidVis =
      vis && vis.from != null && vis.to != null && didInitViewRef.current;

    let fromIdx = 0;
    let toIdx = total - 1;

    if (hasValidVis) {
      // Если уже инициализировались и есть валидный visible range — строим окно вокруг него.
      const visFromSec = vis.from;
      const visToSec = vis.to;
      const visMid = (visFromSec + visToSec) / 2;

      const midIdx = (() => {
        let best = 0;
        let bestDiff = Infinity;
        for (let i = 0; i < total; i += 1) {
          const tSec = toEpochSec(full[i].time);
          if (!Number.isFinite(tSec)) continue;
          const diff = Math.abs(tSec - visMid);
          if (diff < bestDiff) {
            bestDiff = diff;
            best = i;
          }
        }
        return best;
      })();

      const half = Math.floor(estimate / 2);
      fromIdx = Math.max(0, midIdx - half);
      toIdx = Math.min(total - 1, midIdx + half);
    } else {
      // init / no visible range
      const isPresetTf =
        currentTimeframe !== 'all' &&
        Object.prototype.hasOwnProperty.call(TF_SECONDS, currentTimeframe);

      if (
        isPresetTf &&
        Number.isFinite(tfSec) &&
        tfSec > 0 &&
        lastTs != null &&
        lastTs > 0 &&
        total > 0
      ) {
        // Пресетный таймфрейм — показываем весь диапазон TF по времени
        const targetFromSec = lastTs - tfSec;

        let startIdx = 0;
        // Правильный поиск: первый бар, у которого time >= targetFromSec
        for (let i = 0; i < total; i += 1) {
          const tSec = toEpochSec(full[i]?.time);
          if (!Number.isFinite(tSec)) continue;
          if (tSec >= targetFromSec) {
            startIdx = i;
            break;
          }
        }

        fromIdx = startIdx;
        toIdx = total - 1;

        // Защита от совсем огромных датасетов (например, 1s на год)
        const MAX_ALLOWED_FOR_PRESET = 300000;
        const originalBars = toIdx - fromIdx + 1;

        if (originalBars > MAX_ALLOWED_FOR_PRESET) {
          fromIdx = Math.max(0, total - MAX_ALLOWED_FOR_PRESET);
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[FG][VR][PRESET_CLAMPED]', {
              currentTimeframe,
              originalBars,
              clampedTo: MAX_ALLOWED_FOR_PRESET,
            });
          }
        }
      } else {
        // Обычная виртуализация — для non-preset/all/ручного зума
        const baseWindow = estimateByTf ?? estimateByWidth;
        const window = clamp(baseWindow, 1, maxVirtualViewport);

        // Показываем последние `window` баров
        fromIdx = Math.max(0, total - window);
        toIdx = total - 1;
      }
    }

    if (toIdx < fromIdx) {
      toIdx = Math.min(total - 1, fromIdx);
    }

    const slice = full.slice(fromIdx, toIdx + 1);

    const fromTime = slice[0]?.time ?? null;
    const toTime = slice[slice.length - 1]?.time ?? null;

    wasAtRightRef.current = ts.scrollPosition?.() === 0;

    if (virtualRafRef.current) cancelAnimationFrame(virtualRafRef.current);
    virtualRafRef.current = requestAnimationFrame(() => {
      try {
        const candleType = currentCandleType;
        const nextSlice = filterValidBars(
          slice,
          candleType,
          'init effect',
        );
        if (!nextSlice.length) {
          console.warn(
            '[FG][useChartData] Init produced empty slice, setData([])',
          );
          try {
            clearCrosshairSafely(chartInstanceRef.current);
            if (activePriceSliceRef) activePriceSliceRef.current = [];
            series.setData([]);
          } catch {}
          virtualRangeRef.current = {
            fromIdx,
            toIdx,
            fromTime: null,
            toTime: null,
          };
          return;
        }

        let fromSec = fromTime != null ? toEpochSec(fromTime) : null;
        let toSec = toTime != null ? toEpochSec(toTime) : null;
        let safeDate = null;

        if (!resolvedIsExpanded && currentTimeframe === '1d') {
          if (typeof selectedDate === 'string' && selectedDate.trim()) {
            safeDate = selectedDate.trim();
          } else if (Number.isFinite(toSec)) {
            safeDate = new Date(toSec * 1000).toISOString().slice(0, 10);
          }

          if (safeDate) {
            const fromOverride = Math.floor(
              Date.parse(`${safeDate}T07:00:00+03:00`) / 1000,
            );
            const toOverride = Math.floor(
              Date.parse(`${safeDate}T23:50:00+03:00`) / 1000,
            );
            if (
              Number.isFinite(fromOverride) &&
              Number.isFinite(toOverride)
            ) {
              fromSec = fromOverride;
              toSec = toOverride;
            }
          }
        }

        let sessionSlice = nextSlice;
        if (
          !resolvedIsExpanded &&
          currentTimeframe === '1d' &&
          Number.isFinite(fromSec)
        ) {
          sessionSlice = nextSlice.filter((bar) => {
            const tSec = toEpochSec(bar?.time);
            if (!Number.isFinite(tSec)) return false;
            return tSec >= fromSec;
          });
        }

        writeDataPathDiagnostic('ChartCanvas', sessionSlice, {
          currentInterval,
          currentTimeframe,
          currentCandleType,
        });
        if (activePriceSliceRef) activePriceSliceRef.current = sessionSlice;
        series.setData(sessionSlice);
        if (
          resolvedIsExpanded &&
          navOwnerEnabled &&
          currentTimeframe === '1d' &&
          sessionSlice.length > 0
        ) {
          const applySafetyHeal = (logicalRange) => {
            const logicalWidth = logicalRange.to - logicalRange.from;
            if (
              Number.isFinite(logicalWidth) &&
              logicalWidth > COLLAPSED_LOGICAL_WIDTH
            ) {
              return;
            }

            // TEMP SAFETY HEAL: post-setData collapse recovery for owner-nav 1d init path; not a general runtime navigation writer.
            const rightEdge = sessionSlice.length - 1;
            const targetWidth = Math.max(
              COLLAPSED_LOGICAL_WIDTH,
              sessionSlice.length,
            );
            const healed = {
              from: rightEdge - targetWidth,
              to: rightEdge,
            };
            if (!Number.isFinite(healed.from) || !Number.isFinite(healed.to) || healed.to <= healed.from) return;

            ts.setVisibleLogicalRange(healed);
          };

          try {
            const immediateLogical = ts.getVisibleLogicalRange?.();
            const immediateReadable =
              immediateLogical &&
              Number.isFinite(immediateLogical.from) &&
              Number.isFinite(immediateLogical.to);

            if (immediateReadable) {
              applySafetyHeal(immediateLogical);
            } else {
              // Fallback only when logical range is not readable immediately after setData.
              requestAnimationFrame(() => {
                try {
                  const deferredLogical = ts.getVisibleLogicalRange?.();
                  const deferredReadable =
                    deferredLogical &&
                    Number.isFinite(deferredLogical.from) &&
                    Number.isFinite(deferredLogical.to);
                  if (!deferredReadable) return;

                  applySafetyHeal(deferredLogical);
                } catch {}
              });
            }
          } catch {}
        }

        if (
          process.env.NODE_ENV !== 'production' &&
          resolvedIsExpanded &&
          navOwnerEnabled &&
          currentTimeframe === '1d'
        ) {
          console.debug('[FG][DATA_LEN]', {
            tag: 'afterSetData',
            path: 'init',
            totalPrepared: preparedData?.length,
            sliceLen: sessionSlice?.length,
          });
        }

        virtualRangeRef.current = {
          fromIdx,
          toIdx,
          fromTime: sessionSlice[0]?.time ?? null,
          toTime: sessionSlice[sessionSlice.length - 1]?.time ?? null,
        };

        if (!didInitViewRef.current && Number.isFinite(fromSec) && Number.isFinite(toSec) ) {
          const sliceLen = Array.isArray(sessionSlice) ? sessionSlice.length : 0;
          const shouldGuardTinyInitSlice =
            resolvedIsExpanded &&
            navOwnerEnabled &&
            currentTimeframe === '1d';
          const barsExpectedFor1d =
            Number.isFinite(intervalSec) && intervalSec > 0
              ? Math.round(86400 / intervalSec)
              : 0;
          const minOk =
            barsExpectedFor1d > 0
              ? Math.min(50, Math.max(10, Math.floor(barsExpectedFor1d * 0.5)))
              : 10;
          const isTinyInitSlice =
            shouldGuardTinyInitSlice &&
            sliceLen < minOk;

          if (isTinyInitSlice) {
            if (process.env.NODE_ENV !== 'production') {
              const key = `${symbolId || 'nosymbol'}|${currentTimeframe}|${currentInterval}`;
              const seen = skipTinySliceLoggedRef.current;
              if (seen && !seen.has(key)) {
                seen.add(key);
                console.debug('[FG][INIT_RANGE][skipTinySlice]', {
                  sliceLen,
                  minOk,
                  barsExpected: barsExpectedFor1d,
                  intervalSec,
                  key,
                });
              }
            }
          } else {
            const shouldSkipOwnerNavInitRange =
              resolvedIsExpanded &&
              navOwnerEnabled &&
              currentTimeframe === '1d';
            let initFromSec = fromSec;
            let initToSec = toSec;
            const shouldDeferStaleInitOwnership =
              isStaleSelectionPass &&
              resolvedIsExpanded &&
              navOwnerEnabled &&
              currentTimeframe !== '1d' &&
              Number.isFinite(tfSec) &&
              tfSec > 0;
            const pendingInitToken = activePendingInitToken;
            const hasFreshPayloadForPendingInit =
              Boolean(
                pendingInitToken &&
                payloadVersion > pendingInitToken.payloadVersion
              );
            const shouldBlockPendingInitCompletion =
              Boolean(pendingInitToken) && !hasFreshPayloadForPendingInit;
            if (
              resolvedIsExpanded &&
              navOwnerEnabled &&
              currentTimeframe === '1d' &&
              currentInterval === '15m' &&
              Number.isFinite(intervalSec) &&
              intervalSec > 0
            ) {
              const minBarsInInitWindow = 60;
              const minSpanSec = minBarsInInitWindow * intervalSec;
              const currentSpanSec = initToSec - initFromSec;
              if (currentSpanSec < minSpanSec) {
                initFromSec = initToSec - minSpanSec;
              }
            }
            if (
              process.env.NODE_ENV !== 'production' &&
              resolvedIsExpanded &&
              navOwnerEnabled &&
              currentTimeframe === '1d'
            ) {
              const logicalRangeBefore = ts.getVisibleLogicalRange?.();
              const logicalWidthBefore =
                logicalRangeBefore &&
                Number.isFinite(logicalRangeBefore.from) &&
                Number.isFinite(logicalRangeBefore.to)
                  ? logicalRangeBefore.to - logicalRangeBefore.from
                  : null;
              const spanSec = initToSec - initFromSec;
              const barsExpected =
                Number.isFinite(intervalSec) && intervalSec > 0
                  ? spanSec / intervalSec
                  : null;
              console.debug('[FG][INIT_RANGE][1d]', {
                fromSec: initFromSec,
                toSec: initToSec,
                spanSec,
                intervalSec,
                barsExpected,
                logicalWidthBefore,
              });
            }
            if (shouldDeferStaleInitOwnership) {
              lastDeferredInitTraceRef.current = {
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
              };
              pushStaleInitTrace({
                event: 'defer',
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
                selectionChanged,
                preparedDataUnchanged,
                preparedLen: preparedTraceMeta.preparedLen,
                firstTime: preparedTraceMeta.firstTime,
                lastTime: preparedTraceMeta.lastTime,
                didInitViewBefore,
                didInitViewAfter: didInitViewBefore,
                deferTaken: true,
                completionKind: null,
                rangeAction: 'defer',
              });
              if (process.env.NODE_ENV !== 'production') {
                console.debug('[FG][INIT_RANGE][deferStaleSelectionPass]', {
                  key: selectionKey,
                  currentTimeframe,
                  currentInterval,
                  preparedLen: Array.isArray(preparedData) ? preparedData.length : null,
                  sliceLen,
                  fromSec: initFromSec,
                  toSec: initToSec,
                });
              }
            } else if (shouldBlockPendingInitCompletion) {
              if (process.env.NODE_ENV !== 'production') {
                console.debug('[FG][INIT_RANGE][awaitFreshPayload]', {
                  key: selectionKey,
                  selectionVersion,
                  payloadVersion,
                  deferredPayloadVersion: pendingInitToken?.payloadVersion ?? null,
                });
              }
            } else if (shouldSkipOwnerNavInitRange) {
              const completionKind = pendingInitToken
                ? 'after_fresh_payload'
                : 'initial_nonstale';
              pushStaleInitTrace({
                event: 'beforeInitComplete',
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
                selectionChanged,
                preparedDataUnchanged,
                preparedLen: preparedTraceMeta.preparedLen,
                firstTime: preparedTraceMeta.firstTime,
                lastTime: preparedTraceMeta.lastTime,
                didInitViewBefore,
                didInitViewAfter: didInitViewBefore,
                deferTaken: false,
                completionKind,
                rangeAction: 'skipOwnerNavInitRange',
              });
              if (process.env.NODE_ENV !== 'production') {
                const key = `${symbolId || 'nosymbol'}|${currentTimeframe}|${currentInterval}`;
                const seen = skipOwnerNavLoggedRef.current;
                if (seen && !seen.has(key)) {
                  seen.add(key);
                  console.debug('[FG][INIT_RANGE][skipOwnerNav]', { key, sliceLen });
                }
              }
              didInitViewRef.current = true;
              pushStaleInitTrace({
                event: 'afterInitComplete',
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
                selectionChanged,
                preparedDataUnchanged,
                preparedLen: preparedTraceMeta.preparedLen,
                firstTime: preparedTraceMeta.firstTime,
                lastTime: preparedTraceMeta.lastTime,
                didInitViewBefore,
                didInitViewAfter: true,
                deferTaken: false,
                completionKind,
                rangeAction: 'skipOwnerNavInitRange',
              });
              if (pendingInitToken) {
                lastDeferredInitTraceRef.current = null;
              }
            } else {
              const completionKind = pendingInitToken
                ? 'after_fresh_payload'
                : 'initial_nonstale';
              pushStaleInitTrace({
                event: 'beforeInitComplete',
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
                selectionChanged,
                preparedDataUnchanged,
                preparedLen: preparedTraceMeta.preparedLen,
                firstTime: preparedTraceMeta.firstTime,
                lastTime: preparedTraceMeta.lastTime,
                didInitViewBefore,
                didInitViewAfter: didInitViewBefore,
                deferTaken: false,
                completionKind,
                rangeAction: 'setVisibleRange(init)',
              });
              try {
                ts.setVisibleRange({
                  from: initFromSec,
                  to: initToSec,
                });
                if (
                  process.env.NODE_ENV !== 'production' &&
                  resolvedIsExpanded &&
                  navOwnerEnabled &&
                  currentTimeframe === '1d'
                ) {
                  const lr = ts.getVisibleLogicalRange?.();
                  console.debug('[FG][RANGE_AFTER_INIT]', {
                    lrWidth:
                      lr &&
                      Number.isFinite(lr.from) &&
                      Number.isFinite(lr.to)
                        ? lr.to - lr.from
                        : null,
                    lr,
                  });
                }
              } catch (err) {
                console.error('[FG][useChartData] setVisibleRange(init) failed', err);
              }
              didInitViewRef.current = true;
              pushStaleInitTrace({
                event: 'afterInitComplete',
                passId,
                selectionKey,
                selectionVersion,
                payloadVersion,
                selectionChanged,
                preparedDataUnchanged,
                preparedLen: preparedTraceMeta.preparedLen,
                firstTime: preparedTraceMeta.firstTime,
                lastTime: preparedTraceMeta.lastTime,
                didInitViewBefore,
                didInitViewAfter: true,
                deferTaken: false,
                completionKind,
                rangeAction: 'setVisibleRange(init)',
              });
              if (pendingInitToken) {
                lastDeferredInitTraceRef.current = null;
              }
            }
          }
        }

        if (
          !resolvedIsExpanded &&
          currentTimeframe === '1d' &&
          safeDate &&
          Number.isFinite(fromSec) &&
          Number.isFinite(toSec)
        ) {
          const lastApplied = lastAppliedRangeRef.current || {};
          if (lastApplied.from !== fromSec || lastApplied.to !== toSec) {
            try {
              ts.setVisibleRange({
                from: fromSec,
                to: toSec,
              });
              lastAppliedRangeRef.current = { from: fromSec, to: toSec };
            } catch (err) {
              console.error('[FG][useChartData] setVisibleRange(compact-1d) failed', err);
            }
          }
        }

        if (!resolvedIsExpanded && !snapshotRangeRef.current) {
          const logical = ts.getVisibleLogicalRange?.();
          if (
            logical &&
            Number.isFinite(logical.from) &&
            Number.isFinite(logical.to)
          ) {
            snapshotRangeRef.current = { from: logical.from, to: logical.to };
          }
        }
      } catch (err) {
        console.error('[LWC] RAF setData failed', err);
      } finally {
        virtualRafRef.current = null;
      }
    });

    lastTimeRef.current = lastTs;
  }, [
    preparedData,
    payloadVersion,
    currentCandleType,
    currentTimeframe,
    symbolId,
    currentInterval,
    chartInstanceRef,
    chartContainerRef,
    seriesRef,
    fullDataRef,
    virtualRangeRef,
    virtualRafRef,
    wasAtRightRef,
    didInitViewRef,
    activePriceSliceRef,
    lastTimeRef,
    maxVirtualViewport,
    indicatorsMaxLookback,
    resolvedIsExpanded,
    selectedDate,
  ]);

  // NOTE: refs (chartInstanceRef, seriesRef, virtualRangeRef, ...) .   .
  useEffect(() => {
    const chart = chartInstanceRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const ts = chart.timeScale();

    const onTimeRange = (range) => {
      if (!range) {
        return;
      }

      if (isResizingRef.current) {
        return;
      }

      if (!didInitViewRef.current) return;
      if (!fullDataRef.current.length) return;

      const now =
        typeof performance !== 'undefined'
          ? performance.now()
          : Date.now();
      if (now - lastRangeTsRef.current < 50) return;
      lastRangeTsRef.current = now;

      const { from, to } = range;
      const fromSec = Number.isFinite(from) ? from : null;
      const rawFrom = binSearchByTime(fullDataRef.current, from);
      const rawTo = binSearchByTime(fullDataRef.current, to, true);
      const visibleBars = Math.max(0, rawTo - rawFrom + 1);
      if (visibleBars < 5) return;

      const total = fullDataRef.current.length;
      const thrIdx = Math.max(
        150,
        Math.min(1800, Math.round(visibleBars * 0.15)),
      );
      const prev = virtualRangeRef.current || {
        fromIdx: 0,
        toIdx: 0,
      };
      const prevVisibleBars = Math.max(
        0,
        (prev.toIdx ?? 0) - (prev.fromIdx ?? 0) + 1,
      );
      let nextZoomDirection = null;
      if (visibleBars > prevVisibleBars) {
        nextZoomDirection = 'out';
      } else if (visibleBars < prevVisibleBars) {
        nextZoomDirection = 'in';
      } else {
        nextZoomDirection = 'none';
      }

      const rawFromIdx = rawFrom;
      const rawToIdx = rawTo;

      const deltaFrom = Math.abs(rawFromIdx - prev.fromIdx);
      const deltaTo = Math.abs(rawToIdx - prev.toIdx);

      const isSignificantMove = deltaFrom > thrIdx || deltaTo > thrIdx;
      const shouldExpand = isSignificantMove || nextZoomDirection === 'out';

      if (!shouldExpand) {
        const leftIndex = Number.isFinite(rawFromIdx)
          ? rawFromIdx
          : Number.isFinite(rawFrom)
          ? rawFrom
          : null;

        const info = {
          visible: visibleBars,
          prevVisibleBars,
          deltaFrom,
          deltaTo,
          thrIdx,
          direction: nextZoomDirection,
          shouldExpand,
          total,
          leftIndex,
          isNearLeftEdge: typeof leftIndex === 'number' && leftIndex <= LEFT_EDGE_THRESHOLD,
        };

        const hasLoadMoreFn = resolvedIsExpanded && typeof loadMoreHistory === 'function';

        const canLoadMore =
          hasLoadMoreFn &&
          !isLoadingMoreRef.current &&
          info.isNearLeftEdge &&
          typeof visibleBars === 'number' &&
          visibleBars >= MIN_VISIBLE_FOR_LOAD &&
          visibleBars <= MAX_VISIBLE_FOR_LOAD;

        if (process.env.NODE_ENV !== 'production') {
          console.debug('[FG][VR][onTimeRange:edgeCheck]', {
            ...info,
            hasLoadMoreFn,
            isLoadingMore: isLoadingMoreRef.current,
            MIN_VISIBLE_FOR_LOAD,
            MAX_VISIBLE_FOR_LOAD,
          });
        }

        if (canLoadMore) {
          // Guard: onTimeRange может срабатывать сериями на одном и том же левом крае.
          const now = Date.now();
          const COOLDOWN_MS = 1200;
          const lastAt = lastLoadMoreAtRef.current || 0;
          const lastKey = lastLoadMoreKeyRef.current;
          const key = leftIndex; // дедупаем по индексу слева

          if (now - lastAt < COOLDOWN_MS) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[FG][VR][onTimeRange:loadMore][cooldown]', {
                key,
                now,
                lastAt,
                cooldownMs: COOLDOWN_MS,
              });
            }
            prevRangeRef.current = {
              visible: visibleBars,
              total,
              fromIndex: leftIndex,
              toIndex: rawToIdx,
            };
            return;
          }

          if (lastKey != null && key === lastKey) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[FG][VR][onTimeRange:loadMore][dedup]', { key });
            }
            prevRangeRef.current = {
              visible: visibleBars,
              total,
              fromIndex: leftIndex,
              toIndex: rawToIdx,
            };
            return;
          }

          lastLoadMoreAtRef.current = now;
          lastLoadMoreKeyRef.current = key;

          if (process.env.NODE_ENV !== 'production') {
            console.debug('[FG][VR][onTimeRange:loadMore]', info);
          }
          isLoadingMoreRef.current = true;
          // Догружаем «в прошлое»: передаём to как левую границу видимого диапазона (секунды)
          Promise.resolve(loadMoreHistory(fromSec))
            .catch((err) => {
              console.error('[FG][VR][onTimeRange:loadMore:error]', err);
            })
            .finally(() => {
              isLoadingMoreRef.current = false;
            });
          prevRangeRef.current = {
            visible: visibleBars,
            total,
            fromIndex: leftIndex,
            toIndex: rawToIdx,
          };
          return;
        }

        let reason = 'unknown';
        if (!hasLoadMoreFn) reason = 'no-loadMoreHistory';
        else if (isLoadingMoreRef.current) reason = 'already-loading';
        else if (!info.isNearLeftEdge) reason = 'not-near-edge';
        else if (visibleBars < MIN_VISIBLE_FOR_LOAD) reason = 'too-few-visible';
        else if (visibleBars > MAX_VISIBLE_FOR_LOAD) reason = 'too-many-visible';

        if (process.env.NODE_ENV !== 'production') {
          console.debug('[FG][VR][onTimeRange:skip]', {
            ...info,
            reason,
          });
        }

        prevRangeRef.current = {
          visible: visibleBars,
          total,
          fromIndex: leftIndex,
          toIndex: rawToIdx,
        };
        return;
      }

      const baseLeft = Math.floor(visibleBars * 0.3);
      const baseRight = Math.floor(visibleBars * 0.2);
      const bufLeft = Math.max(
        indicatorsMaxLookback + 50,
        baseLeft,
      );
      const bufRight = baseRight;

      let fromIdx;
      let toIdx;

      if (total <= maxVirtualViewport) {
        fromIdx = 0;
        toIdx = total - 1;
      } else {
        fromIdx = Math.max(0, rawFrom - bufLeft);
        toIdx = Math.min(total - 1, rawTo + bufRight);
      }

      isVirtualizingRef.current = true;
      wasAtRightRef.current = ts.scrollPosition?.() === 0;

      if (virtualRafRef.current) cancelAnimationFrame(virtualRafRef.current);
      virtualRafRef.current = requestAnimationFrame(() => {
        const t0 = performance.now();
        try {
          const candleType = currentCandleType;
          const nextSliceRaw = fullDataRef.current.slice(
            fromIdx,
            toIdx + 1,
          );
          const nextSlice = filterValidBars(
            nextSliceRaw,
            candleType,
            'virtualization effect',
          );
          if (!nextSlice.length) {
            console.warn(
              '[FG][useChartData] Virtualization produced empty slice, setData([])',
            );
            try {
              clearCrosshairSafely(chartInstanceRef.current);
              if (activePriceSliceRef) activePriceSliceRef.current = [];
              series.setData([]);
            } catch {}
            virtualRangeRef.current = {
              fromIdx,
              toIdx,
              fromTime: null,
              toTime: null,
            };
            return;
          }

          if (
            typeof window !== 'undefined' &&
            window.__FG_LWC_STATS__
          ) {
            window.__FG_LWC_STATS__.vrSetData += 1;
            window.__FG_LWC_STATS__.lastSlice = nextSlice.length;
            window.__FG_LWC_STATS__.lastVisible = visibleBars;
          }

          let sessionSlice = nextSlice;
          if (!resolvedIsExpanded && currentTimeframe === '1d') {
            const toSec = toEpochSec(nextSlice[nextSlice.length - 1]?.time);
            let safeDate = null;
            if (typeof selectedDate === 'string' && selectedDate.trim()) {
              safeDate = selectedDate.trim();
            } else if (Number.isFinite(toSec)) {
              safeDate = new Date(toSec * 1000).toISOString().slice(0, 10);
            }
            if (safeDate) {
              const cutFromSec = Math.floor(
                Date.parse(`${safeDate}T07:00:00+03:00`) / 1000,
              );
              if (Number.isFinite(cutFromSec)) {
                sessionSlice = nextSlice.filter((bar) => {
                  const tSec = toEpochSec(bar?.time);
                  return Number.isFinite(tSec) && tSec >= cutFromSec;
                });
              }
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              '[FG][useChartData] setData (virtualization)',
              { seriesKind: resolveSeriesKind(currentCandleType) },
              { first: sessionSlice[0], last: sessionSlice[sessionSlice.length - 1] },
            );
          }

          if (activePriceSliceRef) activePriceSliceRef.current = sessionSlice;
          series.setData(sessionSlice);
          if (
            process.env.NODE_ENV !== 'production' &&
            resolvedIsExpanded &&
            navOwnerEnabled &&
            currentTimeframe === '1d'
          ) {
            console.debug('[FG][DATA_LEN]', {
              tag: 'afterSetData',
              path: 'vr',
              totalPrepared: preparedData?.length,
              sliceLen: sessionSlice?.length,
            });
          }

          console.log('%c[ЧАРТ ОТРИСОВАЛ]', 'color: #00ff44; font-size: 16px; font-weight: bold;', {
            баров: sessionSlice.length,
            с_индекса: fromIdx,
            по_индекс: toIdx,
            всего_в_данных: fullDataRef.current.length,
            таймфрейм: currentTimeframe,
            интервал: currentInterval,
            первая_дата: sessionSlice?.[0] ? new Date(sessionSlice[0].time * 1000).toLocaleDateString('ru-RU') : '—',
            последняя_дата: sessionSlice?.length ? new Date(sessionSlice[sessionSlice.length-1].time * 1000).toLocaleDateString('ru-RU') : '—',
          });

          const t1 = performance.now();
          console.log('[LWC] vr setData', sessionSlice.length, 'bars |', (t1 - t0).toFixed(1), 'ms');

          virtualRangeRef.current = {
            fromIdx,
            toIdx,
            fromTime: sessionSlice[0]?.time ?? null,
            toTime: sessionSlice[sessionSlice.length - 1]?.time ?? null,
          };

          if (wasAtRightRef.current) {
            if (resolvedIsExpanded && navOwnerEnabled) {
            } else {
              ts.scrollToRealTime?.();
            }
          }
        } finally {
          isVirtualizingRef.current = false;
        }
      });
    };

    ts.subscribeVisibleTimeRangeChange(onTimeRange);
    return () => {
      try {
        ts.unsubscribeVisibleTimeRangeChange(onTimeRange);
      } catch {}
    };
  }, [
    currentInterval,
    currentTimeframe,
    currentCandleType,
    chartInstanceRef,
    chartContainerRef,
    seriesRef,
    didInitViewRef,
    fullDataRef,
    loadMoreHistory,
    indicatorsMaxLookback,
    isResizingRef,
    isVirtualizingRef,
    lastRangeTsRef,
    maxVirtualViewport,
    virtualRangeRef,
    virtualRafRef,
    wasAtRightRef,
    activePriceSliceRef,
    resolvedIsExpanded,
    selectedDate,
  ]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    const ts = chart.timeScale();
    if (!ts || typeof ts.subscribeVisibleLogicalRangeChange !== 'function') return;

    const clampRange = (range) => {
      if (!range) return null;
      const snap = snapshotRangeRef.current;
      if (!snap) return null;
      const nextFrom = Math.max(range.from, snap.from);
      const nextTo = Math.min(range.to, snap.to);
      if (!Number.isFinite(nextFrom) || !Number.isFinite(nextTo)) return null;
      if (nextFrom > nextTo) return null;
      if (nextFrom === range.from && nextTo === range.to) return null;
      return { from: nextFrom, to: nextTo };
    };

    const handleLogicalRange = (range) => {
      if (resolvedIsExpanded) return;
      const clamped = clampRange(range);
      if (!clamped) return;
      if (isClampingRef.current) return;
      isClampingRef.current = true;
      try {
        ts.setVisibleLogicalRange(clamped);
      } catch {}
      isClampingRef.current = false;
    };

    ts.subscribeVisibleLogicalRangeChange(handleLogicalRange);
    return () => {
      try {
        ts.unsubscribeVisibleLogicalRangeChange(handleLogicalRange);
      } catch {}
    };
  }, [chartInstanceRef, resolvedIsExpanded]);
};
