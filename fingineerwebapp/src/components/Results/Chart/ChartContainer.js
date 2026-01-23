import React, { useEffect } from 'react';
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

// Компонент для синхронизации пропсов с контекстом
const ChartContextSync = ({
  isExpanded,
  chartData,
  isChartLoading,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  socket,
  query,
  selectedDate,
}) => {
  const {
    state,
    isChartLoading: ctxIsChartLoading,
    isExpanded: contextIsExpanded,
    setExpanded,
    setChartData,
    setChartLoading,
    setInterval,
    setTimeframe,
    setCandleType,
    setChartMeta,
  } = useChart();

  const canvasMetrics = state?.canvasMetrics;
  const shouldUseAgg =
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
    enabled: shouldUseAgg,
  });

  useEffect(() => {
    if (isExpanded !== contextIsExpanded) {
      setExpanded(Boolean(isExpanded));
    }
  }, [isExpanded, contextIsExpanded, setExpanded]);

  useEffect(() => {
    if (typeof setInterval === 'function' && currentInterval !== undefined) {
      setInterval(currentInterval);
    }
  }, [currentInterval, setInterval]);

  useEffect(() => {
    if (typeof setTimeframe === 'function' && currentTimeframe !== undefined) {
      setTimeframe(currentTimeframe);
    }
  }, [currentTimeframe, setTimeframe]);

  useEffect(() => {
    if (typeof setCandleType === 'function' && currentCandleType !== undefined) {
      setCandleType(currentCandleType);
    }
  }, [currentCandleType, setCandleType]);

  useEffect(() => {
    if (shouldUseAgg) {
      if (Array.isArray(agg.candles)) {
        const nextRangeKey = String(agg?.rangeKey || chartData?.rangeKey || '');
        setChartData({
          candles: agg.candles,
          error: null,
          rangeKey: nextRangeKey,
          loadMoreHistory: agg.loadMoreHistory,
        });
      }
      return;
    }
    const incoming = chartData || { candles: [], error: null };
    setChartData(incoming);
  }, [shouldUseAgg, agg.candles, chartData, setChartData]);

  useEffect(() => {
    if (shouldUseAgg) {
      setChartLoading(Boolean(agg.loading));
      return;
    }
    const incomingLoading = Boolean(isChartLoading);
    if (incomingLoading !== ctxIsChartLoading) {
      setChartLoading(incomingLoading);
    }
  }, [shouldUseAgg, agg.loading, isChartLoading, ctxIsChartLoading, setChartLoading]);

  useEffect(() => {
    if (!shouldUseAgg || !agg.meta) return;
    setChartMeta(agg.meta);
  }, [shouldUseAgg, agg.meta, setChartMeta]);

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
        currentCandleType={currentCandleType}
        socket={socket}
        query={query}
        selectedDate={selectedDate}
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
