import React, { useEffect } from 'react';
import { ChartProvider, useChart } from './ChartContext';
import ChartContent from './ChartContent';
import './Chart.css';
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

// Компонент для синхронизации пропсов с контекстом
const ChartContextSync = ({ isExpanded, chartData, isChartLoading, currentInterval, currentTimeframe, currentCandleType }) => {
  const {
    chartData: ctxChartData,
    isChartLoading: ctxIsChartLoading,
    isExpanded: contextIsExpanded,
    setExpanded,
    setChartData,
    setChartLoading,
    setInterval,
    setTimeframe,
    setCandleType,
  } = useChart();

  // Синхронизация expanded
  useEffect(() => {
    if (isExpanded !== contextIsExpanded) {
      setExpanded(Boolean(isExpanded));
    }
  }, [isExpanded, contextIsExpanded, setExpanded]);

  // Синхронизация текущего интервала
  useEffect(() => {
    if (typeof setInterval === 'function' && currentInterval !== undefined) {
      setInterval(currentInterval);
    }
  }, [currentInterval, setInterval]);

  // Синхронизация текущего таймфрейма
  useEffect(() => {
    if (typeof setTimeframe === 'function' && currentTimeframe !== undefined) {
      setTimeframe(currentTimeframe);
    }
  }, [currentTimeframe, setTimeframe]);

  // Синхронизация типа свечей
  useEffect(() => {
    if (typeof setCandleType === 'function' && currentCandleType !== undefined) {
      setCandleType(currentCandleType);
    }
  }, [currentCandleType, setCandleType]);

  // Синхронизация chartData
  useEffect(() => {
    const incoming = chartData || { candles: [], error: null };
    setChartData(incoming);
  }, [chartData, setChartData]);

  // ✅ ГЛАВНОЕ ИЗМЕНЕНИЕ: Корректная синхронизация isChartLoading
  useEffect(() => {
    const incomingLoading = Boolean(isChartLoading);
    // Если состояние из пропсов отличается от состояния в контексте, обновляем контекст
    if (incomingLoading !== ctxIsChartLoading) {
        setChartLoading(incomingLoading);
    }
  }, [isChartLoading, ctxIsChartLoading, setChartLoading]);


  return null;
};

const ChartContainer = ({
  chartData,
  isChartLoading,
  currentInterval,
  currentTimeframe,
  currentCandleType,
  onIntervalChange,
  onTimeframeChange,
  onCandleTypeChange,
  query,
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
      />
      <ChartLayout isExpanded={isExpanded}>
        <ChartContent
          onIntervalChange={handleIntervalChange}
          onTimeframeChange={handleTimeframeChange}
          onCandleTypeChange={handleCandleTypeChange}
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