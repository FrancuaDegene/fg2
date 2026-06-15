import React, { useEffect, useRef } from 'react';
import { ChartProvider, useChart } from './ChartContext';
import ChartContent from './ChartContent';
import './Chart.css';
import { useCandles } from '../../../store/useCandles';
import './ChartLayout.css';

// Компонент для обертки графика
const ChartLayout = ({ children, isExpanded }) => {
  return (
    <div className={`chart-layout ${isExpanded ? 'expanded' : ''}`}>
      <div className="chart-area">
        <div className="chart-area-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const FG_AGG_ENABLED = String(process.env.REACT_APP_FG_AGG_ENABLED || '') === '1';

const normalizeCandlesForChartContext = (source) => {
  if (!Array.isArray(source)) return [];

  const byTime = new Map();

  for (const candle of source) {
    if (!candle || typeof candle !== 'object') continue;

    let time = Number(candle.time);
    if (!Number.isFinite(time)) continue;
    if (time > 1e12) time = Math.floor(time / 1000);
    else time = Math.floor(time);

    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    if (![open, high, low, close].every(Number.isFinite)) continue;

    const rawVolume = Number(candle.volume);
    const volume = Number.isFinite(rawVolume) ? rawVolume : 0;

    const existing = byTime.get(time);
    if (existing) {
      existing.high = Math.max(existing.high, high);
      existing.low = Math.min(existing.low, low);
      existing.close = close;
      existing.volume += volume;
      continue;
    }

    byTime.set(time, {
      time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
};

// Компонент для синхронизации пропсов с контекстом
const ChartContextSync = ({
  isExpanded,
  chartData,
  isChartLoading,
  currentInterval,
  currentTimeframe,
  socket,
  query,
  selectedDate,
  sourceAuthority,
  onRestOwnershipSignal,
}) => {
  const {
    state,
    isChartLoading: ctxIsChartLoading,
    currentInterval: contextCurrentInterval,
    currentTimeframe: contextCurrentTimeframe,
    isExpanded: contextIsExpanded,
    setExpanded,
    setChartData,
    setChartLoading,
    setInterval,
    setTimeframe,
    setChartMeta,
  } = useChart();

  const canvasMetrics = state?.canvasMetrics;
  const isRestAuthority = sourceAuthority === 'rest';
  const lastOwnershipSignalRef = useRef('');
  const restInputsReady =
    !!query &&
    !!currentInterval &&
    !!currentTimeframe &&
    !!selectedDate;

  const agg = useCandles({
    socket,
    ticker: query,
    timeframe: currentTimeframe,
    interval: currentInterval,
    selectedDate,
    width: canvasMetrics?.width,
    dpr: canvasMetrics?.dpr,
    // ARCH: Compact должен быть предсказуемым (Range + interval без "магии").
    // Auto-interval оставляем только для Expanded (рабочий режим).
    resolution: isExpanded ? 'auto' : 'fixed',
    strict: !isExpanded,
    enabled: isRestAuthority && restInputsReady,
  });
  const expectedRangeKey = restInputsReady
    ? `${String(query || '').trim().toUpperCase()}|${String(currentTimeframe || '').trim()}`
    : '';
  const incomingChartData = chartData || { candles: [], error: null };
  const incomingRangeKey = String(incomingChartData?.rangeKey || '');
  const hasIncomingCandles =
    Array.isArray(incomingChartData?.candles) && incomingChartData.candles.length > 0;
  const canBootstrapFromApp =
    Boolean(restInputsReady && expectedRangeKey) &&
    incomingRangeKey === expectedRangeKey &&
    hasIncomingCandles;

  useEffect(() => {
    if (isExpanded !== contextIsExpanded) {
      setExpanded(Boolean(isExpanded));
    }
  }, [isExpanded, contextIsExpanded, setExpanded]);

  useEffect(() => {
    if (
      typeof setInterval === 'function' &&
      currentInterval !== undefined &&
      currentInterval !== contextCurrentInterval
    ) {
      setInterval(currentInterval);
    }
  }, [currentInterval, contextCurrentInterval, setInterval]);

  useEffect(() => {
    if (
      typeof setTimeframe === 'function' &&
      currentTimeframe !== undefined &&
      currentTimeframe !== contextCurrentTimeframe
    ) {
      setTimeframe(currentTimeframe);
    }
  }, [currentTimeframe, contextCurrentTimeframe, setTimeframe]);

  useEffect(() => {
    if (isRestAuthority) {
      if (!restInputsReady) {
        setChartData({
          candles: [],
          error: agg.error ?? null,
          rangeKey: '',
          loadMoreHistory: undefined,
        });
        return;
      }

      if (!agg.meta) {
        if (canBootstrapFromApp) {
          setChartData({
            ...incomingChartData,
            candles: normalizeCandlesForChartContext(incomingChartData.candles),
            error: agg.error ?? incomingChartData?.error ?? null,
            rangeKey: incomingRangeKey || expectedRangeKey,
            loadMoreHistory: undefined,
          });
          return;
        }

        setChartData({
          candles: [],
          error: agg.error ?? null,
          rangeKey: String(agg?.rangeKey || expectedRangeKey || ''),
          loadMoreHistory: undefined,
        });
        return;
      }

      setChartData({
        candles: normalizeCandlesForChartContext(agg.candles),
        error: agg.error ?? null,
        rangeKey: String(agg?.rangeKey || ''),
        loadMoreHistory: agg.loadMoreHistory,
      });
      return;
    }

    const incoming = chartData || { candles: [], error: null };
    setChartData({
      ...incoming,
      candles: normalizeCandlesForChartContext(incoming.candles),
    });
  }, [
    isRestAuthority,
    restInputsReady,
    agg.candles,
    agg.error,
    agg.meta,
    agg.rangeKey,
    agg.loadMoreHistory,
    incomingChartData,
    incomingRangeKey,
    expectedRangeKey,
    canBootstrapFromApp,
    chartData,
    setChartData,
  ]);

  useEffect(() => {
    if (isRestAuthority) {
      setChartLoading(restInputsReady ? !agg.meta || Boolean(agg.loading) : false);
      return;
    }

    const incomingLoading = Boolean(isChartLoading);
    if (incomingLoading !== ctxIsChartLoading) {
      setChartLoading(incomingLoading);
    }
  }, [isRestAuthority, restInputsReady, agg.meta, agg.loading, isChartLoading, ctxIsChartLoading, setChartLoading]);

  useEffect(() => {
    if (!isRestAuthority) return;

    if (!restInputsReady || !agg.meta) {
      setChartMeta({
        dataResolution: 'auto',
        sourceInterval: null,
        isDownsampled: false,
        points: null,
      });
      return;
    }

    setChartMeta(agg.meta);
  }, [isRestAuthority, restInputsReady, agg.meta, setChartMeta]);

  useEffect(() => {
    if (!isRestAuthority) {
      lastOwnershipSignalRef.current = '';
      return;
    }
    if (typeof onRestOwnershipSignal !== 'function') return;

    if (!restInputsReady) {
      if (lastOwnershipSignalRef.current !== 'reset') {
        lastOwnershipSignalRef.current = 'reset';
        onRestOwnershipSignal({ phase: 'reset' });
      }
      return;
    }

    const tickerKey = String(query || '').trim().toUpperCase();
    const timeframeKey = String(currentTimeframe || '').trim();
    const intervalKey = String(currentInterval || '').trim();
    const selectedDateKey = String(selectedDate || '').trim();
    const selection = {
      ticker: tickerKey,
      timeframe: timeframeKey,
      interval: intervalKey,
      selectedDate: selectedDateKey,
    };
    const rangeKey = String(agg?.rangeKey || `${tickerKey}|${timeframeKey}`);
    const errorMessage =
      typeof agg?.error === 'string'
        ? agg.error
        : agg?.error?.message
          ? String(agg.error.message)
          : null;

    if (agg.loading) {
      const pendingSignature = JSON.stringify({ phase: 'pending', selection });
      if (lastOwnershipSignalRef.current !== pendingSignature) {
        lastOwnershipSignalRef.current = pendingSignature;
        onRestOwnershipSignal({ phase: 'pending', selection, rangeKey });
      }
      return;
    }

    if (errorMessage) {
      const failureSignature = JSON.stringify({ phase: 'failure', selection, errorMessage });
      if (lastOwnershipSignalRef.current !== failureSignature) {
        lastOwnershipSignalRef.current = failureSignature;
        onRestOwnershipSignal({ phase: 'failure', selection, rangeKey, error: errorMessage });
      }
      return;
    }

    if (agg.meta && agg.isSelectionFresh) {
      const commitSignature = JSON.stringify({
        phase: 'commit',
        selection,
        rangeKey,
        hasCandles: Array.isArray(agg.candles) && agg.candles.length > 0,
        noData: Boolean(agg.meta?.noData),
      });
      if (lastOwnershipSignalRef.current !== commitSignature) {
        lastOwnershipSignalRef.current = commitSignature;
        onRestOwnershipSignal({
          phase: 'commit',
          selection,
          rangeKey,
          hasCandles: Array.isArray(agg.candles) && agg.candles.length > 0,
          noData: Boolean(agg.meta?.noData),
        });
      }
    }
  }, [
    agg.candles,
    agg.error,
    agg.isSelectionFresh,
    agg.loading,
    agg.meta,
    agg.rangeKey,
    currentInterval,
    currentTimeframe,
    isRestAuthority,
    onRestOwnershipSignal,
    query,
    restInputsReady,
    selectedDate,
  ]);

  return null;
};

const ChartContainer = ({
  chartData,
  instrumentMeta,
  isChartLoading,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  onIntervalChange,
  onTimeframeChange,
  onCandleTypeChange,
  query,
  selectedDate,
  socket,
  isExpanded,
  onToggleExpand,
  onToggleSearch,
  onSearch,
  onRestOwnershipSignal,
  sourceAuthority,
}) => {
  const initialData = {
    chartData: chartData || { candles: [], error: null },
    isChartLoading: isChartLoading || false,
    currentInterval: currentInterval || '1m',
    currentTimeframe: currentTimeframe || '1d',
    currentCandleType: currentCandleType || 'candlestick',
    isExpanded: isExpanded || false,
  };

  const handleIntervalChange = typeof onIntervalChange === 'function' ? onIntervalChange : undefined;
  const handleTimeframeChange = typeof onTimeframeChange === 'function' ? onTimeframeChange : undefined;
  const handleCandleTypeChange = typeof onCandleTypeChange === 'function' ? onCandleTypeChange : undefined;
  const handleToggleExpand = typeof onToggleExpand === 'function' ? onToggleExpand : undefined;
  const handleSearch = typeof onSearch === 'function' ? onSearch : undefined;

  return (
    <ChartProvider initialData={initialData}>
      <ChartContextSync
        isExpanded={isExpanded}
        chartData={chartData}
        isChartLoading={isChartLoading}
        currentInterval={currentInterval}
        currentTimeframe={currentTimeframe}
        socket={socket}
        query={query}
        selectedDate={selectedDate}
        sourceAuthority={sourceAuthority}
        onRestOwnershipSignal={onRestOwnershipSignal}
      />
      <ChartLayout isExpanded={isExpanded}>
        <ChartContent
          onIntervalChange={handleIntervalChange}
          onTimeframeChange={handleTimeframeChange}
          onCandleTypeChange={handleCandleTypeChange}
          instrumentMeta={instrumentMeta}
          onToggleExpand={handleToggleExpand}
          onToggleSearch={onToggleSearch}
          onSearch={handleSearch}
          query={query}
        />
      </ChartLayout>
    </ChartProvider>
  );
};

export default ChartContainer;
