import React, { useEffect } from 'react';
import { ChartProvider, useChart } from './ChartContext';
import ChartContent from './ChartContent';
import './Chart.css';
import { useCandles } from '../../../store/useCandles';
import './ChartLayout.css';
import { fixIntervalForTimeframe } from '../../../lib/timeframes';

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
    resolution: 'auto',
    // В compact (одна кнопка Range) интервал не выбираем в UI,
    // но он уже нормализован TFGuard'ом. Поэтому запрещаем auto-LOD
    // самовольно повышать intervalUsed (иначе VR думает 1h, а данные приходят 1d).
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
        setChartData({
          candles: agg.candles,
          error: null,
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
  // Нормализуем связку TF×interval на входе.
  // Важно: в Compact UI может не давать выбрать интервал, но "плохая" связка может
  // прилететь пропсами (restore state / смена тикера / deeplink / legacy code).
  const safeIsExpanded = Boolean(isExpanded);
  const safeTimeframe = currentTimeframe || '1d';
  const safeIntervalRaw = currentInterval || '1m';
  const safeInterval = fixIntervalForTimeframe(safeIntervalRaw, safeTimeframe, {
    isExpanded: safeIsExpanded,
  });

  const initialData = {
    chartData: chartData || { candles: [], error: null },
    isChartLoading: isChartLoading || false,
    currentInterval: safeInterval,
    currentTimeframe: safeTimeframe,
    currentCandleType: currentCandleType || 'candlestick',
    isExpanded: safeIsExpanded,
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
