import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import ChartToolbar from './ChartToolbar';
import ChartRenderer from './ChartRenderer';
import { useChart } from './ChartContext';
import './Chart.css';

const ChartContent = ({
  onIntervalChange,
  onTimeframeChange,
  onToggleExpand,
  onToggleSearch,
  onSearch,
  query,
}) => {
  const {
    chartData,
    isChartLoading,
    currentInterval,
    currentTimeframe,
    currentCandleType,
    isExpanded,
    setCandleType,
  } = useChart();

  console.log('ChartContent rendered with chartData:', chartData);
  console.log('ChartContent rendered with isExpanded:', isExpanded);

  // Мемоизируем функции-обработчики
  const handleIntervalChange = useCallback((interval) => {
    if (typeof onIntervalChange === 'function') {
      onIntervalChange(interval);
    }
  }, [onIntervalChange]);

  const handleTimeframeChange = useCallback((timeframe) => {
    if (typeof onTimeframeChange === 'function') {
      onTimeframeChange(timeframe);
    }
  }, [onTimeframeChange]);

  const handleToggleExpand = useCallback((next) => {
  if (typeof onToggleExpand === 'function') {
    onToggleExpand(next);        // <-- пробрасываем boolean дальше
  }
}, [onToggleExpand]);

  const handleSearch = useCallback((searchQuery) => {
    if (typeof onSearch === 'function') {
  console.log('[ChartContent] calling onSearch with', searchQuery);
  onSearch(searchQuery);
    }
  }, [onSearch]);

  const handleCandleTypeChange = useCallback((type) => {
    if (typeof setCandleType === 'function') {
      setCandleType(type);
    }
  }, [setCandleType]);

  return (
    <>
      <ChartRenderer
        chartData={chartData}
        currentInterval={currentInterval}
        currentTimeframe={currentTimeframe}
        currentCandleType={currentCandleType}
        isChartLoading={isChartLoading}
        isExpanded={isExpanded}
        onIntervalChange={handleIntervalChange}
        onTimeframeChange={handleTimeframeChange}
        onToggleExpand={handleToggleExpand}
        onCandleTypeChange={handleCandleTypeChange}
        onSearch={handleSearch}
      />
    </>
  );
};

ChartContent.propTypes = {
  onIntervalChange: PropTypes.func,
  onTimeframeChange: PropTypes.func,
  onToggleExpand: PropTypes.func,
  onToggleSearch: PropTypes.func,
  onSearch: PropTypes.func,
  query: PropTypes.string,
};

const MemoizedChartContent = memo(ChartContent, (prevProps, nextProps) => {
  return (
    prevProps.onIntervalChange === nextProps.onIntervalChange &&
    prevProps.onTimeframeChange === nextProps.onTimeframeChange &&
    prevProps.onToggleExpand === nextProps.onToggleExpand &&
    prevProps.onToggleSearch === nextProps.onToggleSearch &&
    prevProps.onSearch === nextProps.onSearch &&
    prevProps.query === nextProps.query
  );
});

export default MemoizedChartContent;