// ChartRenderer.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChartToolbar from './ChartToolbar';
import ChartCanvas from './ChartCanvas';
import { MultiPaneChart } from '../../../charts/MultiPaneChart';
import ChartTooltip from './ChartTooltip';
import './ChartModal.css';
import { TOOL_IDS } from './DrawToolbar';
import ChartShell from './ChartShell';
import TickerCard from './TickerCard';
import './ChartLayout.css';
import ActiveIndicators from './ActiveIndicators';
import TopMetricsBar from './TopMetricsBar';

/**
 * @typedef {'candles'|'line'} SeriesKind
 *
 * @typedef {Object} HoverSnapshot
 * @property {string|null|undefined} symbolId
 * @property {SeriesKind} kind
 * @property {number|null|undefined} ts
 * @property {number|null|undefined} price
 * @property {number|null|undefined} open
 * @property {number|null|undefined} high
 * @property {number|null|undefined} low
 * @property {number|null|undefined} close
 * @property {number|null|undefined} volume
 * @property {number|null|undefined} prevClose
 * @property {number|null|undefined} baseline
 */

const SERIES_KIND = Object.freeze({
  CANDLES: 'candles',
  LINE: 'line',
});

const LINE_TYPE_SET = new Set([
  'line',
  'line_with_markers',
  'stepped_line',
  'tick_chart',
  'area',
  'area_hlc',
  'baseline',
]);

const PRICE_EPS = 1e-6;
const PCT_EPS = 0.005;
const TOP_METRICS_STORAGE_KEY = 'fg.topMetrics.enabled';
const TOP_METRICS_QUERY_PARAM = 'tm';

const resolveSeriesKind = (type) => {
  const key = (type || '').toString().toLowerCase();
  return LINE_TYPE_SET.has(key) ? SERIES_KIND.LINE : SERIES_KIND.CANDLES;
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const pickNumber = (...values) => {
  for (const candidate of values) {
    const parsed = toNumber(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
};

const parseToggleValue = (value) => {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'on', 'yes', 'enable', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'off', 'no', 'disable', 'disabled'].includes(normalized)) return false;
  return null;
};

const resolveInitialTopMetricsPreference = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = parseToggleValue(params.get(TOP_METRICS_QUERY_PARAM));
    if (queryValue !== null) {
      try {
        window.localStorage.setItem(TOP_METRICS_STORAGE_KEY, queryValue ? '1' : '0');
      } catch {}
      return queryValue;
    }
  } catch {}

  try {
    const stored = window.localStorage.getItem(TOP_METRICS_STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {}

  return true;
};

const buildSymbolId = (symbol, exchange, fallback) => {
  const baseSymbol = symbol ? String(symbol).toUpperCase() : '';
  const baseExchange = exchange ? String(exchange).toUpperCase() : '';
  if (fallback && typeof fallback === 'string' && fallback.trim()) {
    return fallback.toUpperCase();
  }
  if (baseSymbol && baseExchange) {
    return `${baseExchange}:${baseSymbol}`;
  }
  return baseSymbol || baseExchange || 'SBER';
};

export const TOP_METRICS_KILL_SWITCH = false;

const ChartRenderer = ({
  chartData,
  instrumentMeta = {},
  activeIndicators = [],
  currentInterval,
  currentTimeframe,
  currentCandleType,
  isChartLoading,
  isExpanded,
  onIntervalChange,
  onTimeframeChange,
  onToggleExpand,
  onCandleTypeChange,
  onOpenSearch,
}) => {
  const [activeTool, setActiveTool] = useState(TOOL_IDS.SELECT);
  const [hoverSnapshot, setHoverSnapshot] = useState(null);
  const hoverFrameRef = useRef({ frameId: null, payload: null });
  const multiPaneContainerRef = useRef(null);
  const [multiPaneTooltip, setMultiPaneTooltip] = useState({
    data: null,
    position: null,
    visible: false,
  });
  const [topMetricsPref, setTopMetricsPref] = useState(() => resolveInitialTopMetricsPreference());
  const hasRightRail = false;
  const shouldUseMultiPane = useMemo(() => {
    if (!isExpanded) return false;
    if (!Array.isArray(activeIndicators) || activeIndicators.length === 0) return false;
    const visibleIndicators = activeIndicators.filter((indicator) => indicator && indicator.visible !== false);
    return visibleIndicators.some((indicator) =>
      indicator && (indicator.id === 'volume' || indicator.id === 'rsi')
    );
  }, [activeIndicators, isExpanded]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (next) => {
      const parsed = typeof next === 'string' ? parseToggleValue(next) : next;
      if (parsed === null || parsed === undefined) return;
      setTopMetricsPref(Boolean(parsed));
    };
    window.__fgTopMetricsToggle = handler;
    return () => {
      if (window.__fgTopMetricsToggle === handler) {
        delete window.__fgTopMetricsToggle;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TOP_METRICS_STORAGE_KEY, topMetricsPref ? '1' : '0');
    } catch {}
  }, [topMetricsPref]);

  const {
    symbol: metaSymbol,
    exchange: metaExchange,
    currency: metaCurrency,
    lastPrice: metaLastPrice,
    dayChangePct: metaChangePct,
    dayVolume: metaDayVolume,
    symbolId: metaSymbolId,
    prevClose: metaPrevClose,
    prevCloseAdjusted: metaPrevCloseAdjusted,
    prevCloseAdjustedTs: metaPrevCloseAdjustedTs,
    prevCloseRaw: metaPrevCloseRaw,
    tickSize: metaTickSize,
    displayDecimals: metaDisplayDecimals,
  } = instrumentMeta || {};

  const resolvedSymbol = metaSymbol ? String(metaSymbol).toUpperCase() : 'SBER';
  const resolvedExchange = metaExchange ? String(metaExchange).toUpperCase() : 'MOEX';
  const resolvedCurrency = metaCurrency ? String(metaCurrency).toUpperCase() : 'RUB';

  const resolvedSymbolId = useMemo(
    () => buildSymbolId(resolvedSymbol, resolvedExchange, metaSymbolId),
    [resolvedSymbol, resolvedExchange, metaSymbolId]
  );

  const lastCandleData = useMemo(() => {
    const candles = chartData?.candles;
    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        open: null,
        high: null,
        low: null,
        close: null,
        volume: null,
        prevClose: null,
        ts: null,
      };
    }

    const last = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : null;

    return {
      open: toNumber(last?.open),
      high: toNumber(last?.high),
      low: toNumber(last?.low),
      close: toNumber(last?.close),
      volume: toNumber(last?.volume),
      ts: last?.time != null ? Number(last.time) : null,
      prevClose: toNumber(prev?.close),
    };
  }, [chartData?.candles]);

  const defaultPrice = useMemo(() => {
    const provided = toNumber(metaLastPrice);
    if (provided !== null) return provided;
    if (lastCandleData.close !== null) return lastCandleData.close;
    return 159.85;
  }, [metaLastPrice, lastCandleData]);

  const dayPrevClose = useMemo(() => {
    const fromMeta = toNumber(metaPrevClose);
    if (fromMeta !== null) return fromMeta;
    if (lastCandleData.prevClose !== null) return lastCandleData.prevClose;
    return null;
  }, [metaPrevClose, lastCandleData]);

  const defaultChangePct = useMemo(() => {
    const provided = toNumber(metaChangePct);
    if (provided !== null) return provided;
    if (dayPrevClose !== null && defaultPrice !== null && Math.abs(dayPrevClose) > PRICE_EPS) {
      return ((defaultPrice - dayPrevClose) / dayPrevClose) * 100;
    }
    return null;
  }, [metaChangePct, dayPrevClose, defaultPrice]);

  const defaultVolume = useMemo(() => {
    const volume = toNumber(metaDayVolume);
    if (volume !== null) return volume;
    if (lastCandleData.volume !== null) return lastCandleData.volume;
    return null;
  }, [metaDayVolume, lastCandleData]);

  const seriesKind = useMemo(() => resolveSeriesKind(currentCandleType), [currentCandleType]);

  const tickerCardMeta = useMemo(() => {
    const base = instrumentMeta || {};
    return {
      ...base,
      lastPrice: base.lastPrice ?? defaultPrice ?? null,
      dayChangePct: base.dayChangePct ?? defaultChangePct ?? null,
      dayVolume: base.dayVolume ?? defaultVolume ?? null,
      prevClose: base.prevClose ?? dayPrevClose ?? null,
    };
  }, [instrumentMeta, defaultPrice, defaultChangePct, defaultVolume, dayPrevClose]);

  const metrics = useMemo(() => {
    const isHoverValid =
      hoverSnapshot &&
      typeof hoverSnapshot === 'object' &&
      (hoverSnapshot.symbolId == null || hoverSnapshot.symbolId === resolvedSymbolId);

    const base = (() => {
      if (isHoverValid) {
        const kind = hoverSnapshot.kind === SERIES_KIND.LINE ? SERIES_KIND.LINE : SERIES_KIND.CANDLES;
        const close = pickNumber(hoverSnapshot.close, hoverSnapshot.price);
        const open = pickNumber(hoverSnapshot.open, close);
        const high = pickNumber(hoverSnapshot.high, close);
        const low = pickNumber(hoverSnapshot.low, close);
        const volume = toNumber(hoverSnapshot.volume);
        return {
          source: 'hover',
          isCandle: kind === SERIES_KIND.CANDLES,
          open: kind === SERIES_KIND.CANDLES ? open : null,
          high: kind === SERIES_KIND.CANDLES ? high : null,
          low: kind === SERIES_KIND.CANDLES ? low : null,
          close,
          volume: volume ?? null,
          prevClose: toNumber(hoverSnapshot.prevClose),
          ts: hoverSnapshot.ts != null ? Number(hoverSnapshot.ts) : null,
        };
      }

      if (lastCandleData) {
        return {
          source: 'last',
          isCandle: seriesKind === SERIES_KIND.CANDLES,
          open: seriesKind === SERIES_KIND.CANDLES ? lastCandleData.open : null,
          high: seriesKind === SERIES_KIND.CANDLES ? lastCandleData.high : null,
          low: seriesKind === SERIES_KIND.CANDLES ? lastCandleData.low : null,
          close: lastCandleData.close,
          volume: lastCandleData.volume,
          prevClose: lastCandleData.prevClose,
          ts: lastCandleData.ts,
        };
      }

      return {
        source: 'empty',
        isCandle: seriesKind === SERIES_KIND.CANDLES,
        open: null,
        high: null,
        low: null,
        close: null,
        volume: null,
        prevClose: null,
        ts: null,
      };
    })();

    const prevCloseRaw = pickNumber(
      metaPrevCloseRaw,
      base.prevClose,
      dayPrevClose,
      lastCandleData?.prevClose
    );
    const prevCloseAdjusted = toNumber(metaPrevCloseAdjusted);

    let prevClose = null;
    let adjUsed = false;
    let staleAdj = false;
    let deltaBase = 'none';

    if (prevCloseAdjusted !== null) {
      prevClose = prevCloseAdjusted;
      adjUsed = true;
      deltaBase = 'adj';
      if (prevCloseRaw !== null) {
        const denominator = Math.max(Math.abs(prevCloseRaw), PRICE_EPS);
        const diffRatio = Math.abs(prevCloseAdjusted - prevCloseRaw) / denominator;
        staleAdj = diffRatio > 0.25;
      }
    } else if (prevCloseRaw !== null) {
      prevClose = prevCloseRaw;
      deltaBase = 'raw';
    }

    const close = toNumber(base.close);
    const rawDeltaAbs = prevClose !== null && close !== null ? close - prevClose : null;
    const rawDeltaPct =
      prevClose !== null && close !== null && Math.abs(prevClose) > PRICE_EPS
        ? (rawDeltaAbs / prevClose) * 100
        : null;

    const normalizedDeltaAbs =
      rawDeltaAbs !== null && Math.abs(rawDeltaAbs) < PRICE_EPS ? 0 : rawDeltaAbs;
    const normalizedDeltaPct =
      rawDeltaPct !== null && Math.abs(rawDeltaPct) < PCT_EPS ? 0 : rawDeltaPct;

    let direction = 'flat';
    if (normalizedDeltaAbs !== null) {
      if (normalizedDeltaAbs > 0) direction = 'up';
      else if (normalizedDeltaAbs < 0) direction = 'down';
    }

    return {
      source: base.source,
      state: {
        source: base.source,
        hasHover: base.source === 'hover',
      },
      isCandle: Boolean(base.isCandle),
      open: base.isCandle ? toNumber(base.open) : null,
      high: base.isCandle ? toNumber(base.high) : null,
      low: base.isCandle ? toNumber(base.low) : null,
      close,
      volume: toNumber(base.volume),
      prevClose,
      deltaAbs: normalizedDeltaAbs,
      deltaPct: normalizedDeltaPct,
      direction,
      ts: base.ts ?? lastCandleData?.ts ?? null,
      currency: resolvedCurrency,
      flags: {
        adjUsed,
        staleAdj,
        deltaBase,
        adjustedTs: metaPrevCloseAdjustedTs ? Number(metaPrevCloseAdjustedTs) : null,
        tickSize: toNumber(metaTickSize),
        displayDecimals: toNumber(metaDisplayDecimals),
        priceEps: PRICE_EPS,
        pctEps: PCT_EPS,
      },
    };
  }, [
    hoverSnapshot,
    resolvedSymbolId,
    lastCandleData,
    seriesKind,
    metaPrevCloseRaw,
    dayPrevClose,
    metaPrevCloseAdjusted,
    resolvedCurrency,
    metaPrevCloseAdjustedTs,
    metaTickSize,
    metaDisplayDecimals,
  ]);

  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const isTopMetricsEnabled = !TOP_METRICS_KILL_SWITCH && topMetricsPref;
  const hideTickerPrice = isExpanded && isTopMetricsEnabled;

  const handleTickerCompare = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[TickerCard] compare requested');
    }
  }, []);

  const handleTickerNews = useCallback(() => {
    if (typeof onOpenSearch === 'function') {
      onOpenSearch();
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[TickerCard] news requested');
    }
  }, [onOpenSearch]);

  const clearScheduledHover = useCallback(() => {
    const store = hoverFrameRef.current;
    if (store.frameId !== null) {
      cancelAnimationFrame(store.frameId);
      store.frameId = null;
    }
    store.payload = null;
  }, []);

  useEffect(() => {
    return () => {
      clearScheduledHover();
    };
  }, [clearScheduledHover]);

  useEffect(() => {
    setHoverSnapshot(null);
    clearScheduledHover();
  }, [
    resolvedSymbolId,
    currentInterval,
    currentTimeframe,
    currentCandleType,
    isExpanded,
    clearScheduledHover,
  ]);

  const scheduleHoverUpdate = useCallback(
    (nextValue) => {
      if (!isExpanded) {
        if (nextValue == null) {
          setHoverSnapshot(null);
          clearScheduledHover();
        }
        return;
      }

      const store = hoverFrameRef.current;
      store.payload = nextValue ?? null;
      if (store.frameId !== null) return;

      store.frameId = requestAnimationFrame(() => {
        const payload = store.payload;
        store.payload = null;
        store.frameId = null;

        if (payload === null) {
          setHoverSnapshot(null);
          return;
        }

        if (!payload || typeof payload !== 'object') {
          return;
        }

        if (payload.symbolId && resolvedSymbolId && payload.symbolId !== resolvedSymbolId) {
          return;
        }

        setHoverSnapshot(payload);
      });
    },
    [resolvedSymbolId, isExpanded, clearScheduledHover]
  );

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const handleMultiPaneHover = useCallback(
    (payload) => {
      if (!payload) {
        scheduleHoverUpdate(null);
        setMultiPaneTooltip({ data: null, position: null, visible: false });
        return;
      }

      const { candle, prevCandle, point } = payload;
      if (!candle) {
        scheduleHoverUpdate(null);
        setMultiPaneTooltip({ data: null, position: null, visible: false });
        return;
      }

      scheduleHoverUpdate({
        kind: 'candles',
        symbolId: resolvedSymbolId,
        ts: Number(candle.time),
        price: toNumber(candle.close),
        open: toNumber(candle.open),
        high: toNumber(candle.high),
        low: toNumber(candle.low),
        close: toNumber(candle.close),
        volume: toNumber(candle.volume),
        prevClose: toNumber(prevCandle?.close),
      });

      setMultiPaneTooltip({
        data: candle,
        position: point || null,
        visible: Boolean(point),
      });
    },
    [resolvedSymbolId, scheduleHoverUpdate]
  );

  return (
    <div
      style={{
        position: isExpanded ? 'fixed' : 'relative',
        top: isExpanded ? 0 : 'auto',
        left: isExpanded ? 0 : 'auto',
        right: isExpanded ? 0 : 'auto',
        bottom: isExpanded ? 0 : 'auto',
        width: isExpanded ? '100vw' : '100%',
        height: isExpanded ? '100vh' : '700px',
        zIndex: isExpanded ? 9999 : 1,
        background: isExpanded ? 'rgba(242, 245, 252, 0.88)' : 'rgba(19, 23, 34, 0.96)',
        padding: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className="chart-host"
        data-expanded={isExpanded ? '1' : '0'}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: isExpanded ? 'transparent' : '#131722',
          borderRadius: isExpanded ? '0' : '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 0
        }}
      >
        <div className="tb__section">
          <div className="tb__slot--left" />
          <div className="tb__slot--right">
            <ChartToolbar
              isExpanded={isExpanded}
              currentInterval={currentInterval}
              onIntervalChange={onIntervalChange}
              currentTimeframe={currentTimeframe}
              onTimeframeChange={onTimeframeChange}
              currentCandleType={currentCandleType}
              onCandleTypeChange={onCandleTypeChange}
              onToggleExpand={onToggleExpand}
              onOpenSearch={onOpenSearch}
            />
          </div>
        </div>

        {/* Оверлей слева: карточка не участвует в сетке, ничего не толкает */}
        {isExpanded && (
          <div className="overlay-left">
            <TickerCard
              instrumentMeta={tickerCardMeta}
              hover={hoverSnapshot}
              showPrice={!hideTickerPrice}
              size={isExpanded ? 'md' : 'sm'}
              onOpenSearch={onOpenSearch}
              onActionCompare={handleTickerCompare}
              onActionNews={handleTickerNews}
            />
          </div>
        )}
        {/* полупрозрачный «scrim» под капсулами тулбара */}
        <div className="toolbar-scrim" aria-hidden="true" />

        {isExpanded && isTopMetricsEnabled && metricsRef.current && (
          <TopMetricsBar {...metricsRef.current} />
        )}

        <div className="global-rail" aria-hidden="true" />

        <div className="chart-separator" />
        <ChartShell
          isExpanded={isExpanded}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          hasRightRail={hasRightRail}
        >
          <ActiveIndicators />
          {shouldUseMultiPane ? (
            <div
              ref={multiPaneContainerRef}
              style={{ position: 'relative', width: '100%', height: '100%' }}
            >
              <MultiPaneChart
                data={Array.isArray(chartData?.candles) ? chartData.candles : []}
                indicators={activeIndicators}
                onHover={handleMultiPaneHover}
                symbolId={resolvedSymbolId}
                referencePrice={dayPrevClose}
                style={{ height: '100%' }}
              />
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
              {(!isExpanded || !isTopMetricsEnabled) && (
                <ChartTooltip
                  data={multiPaneTooltip.data}
                  isVisible={multiPaneTooltip.visible}
                  position={multiPaneTooltip.position}
                  containerRef={multiPaneContainerRef}
                />
              )}
            </div>
          ) : (
            <ChartCanvas
              key={isExpanded ? 'expanded' : 'normal'}
              chartData={chartData}
              currentInterval={currentInterval}
              currentTimeframe={currentTimeframe}
              currentCandleType={currentCandleType}
              isChartLoading={isChartLoading}
              isExpanded={isExpanded}
              onHover={scheduleHoverUpdate}
              symbolId={resolvedSymbolId}
              prevClose={dayPrevClose}
              showTooltip={!isExpanded || !isTopMetricsEnabled}
            />
          )}
        </ChartShell>
      </div>
    </div>
  );
};
      
export default ChartRenderer;
