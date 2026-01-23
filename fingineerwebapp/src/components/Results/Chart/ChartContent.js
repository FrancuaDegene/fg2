import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import ChartRenderer from './ChartRenderer';
import DashboardColumn from '../../DashboardColumn/DashboardColumn';
import { useChart, useChartState } from './ChartContext';
import './Chart.css';

const ChartContent = ({
  onIntervalChange,
  onTimeframeChange,
  onToggleExpand,
  onToggleSearch,
  onSearch,
  instrumentMeta,
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
    activeIndicators,
  } = useChart();
  const { activeTicker, instrumentMeta: stateInstrumentMeta, lastCandleData, chartMeta } = useChartState();
  const enableDashboard = String(process.env.REACT_APP_FEATURE_DASHBOARD) === '1';

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

  const handleOpenSearch = useCallback(() => {
    if (typeof onToggleSearch === 'function') {
      onToggleSearch();
    }
  }, [onToggleSearch]);

  const handleCandleTypeChange = useCallback((type) => {
    if (typeof setCandleType === 'function') {
      setCandleType(type);
    }
  }, [setCandleType]);

  return (
    <>
      <ChartRenderer
        chartData={chartData}
        instrumentMeta={instrumentMeta}
        activeIndicators={activeIndicators}
        chartMeta={chartMeta}
        currentInterval={currentInterval}
        currentTimeframe={currentTimeframe}
        currentCandleType={currentCandleType}
        isChartLoading={isChartLoading}
        isExpanded={isExpanded}
        onIntervalChange={handleIntervalChange}
        onTimeframeChange={handleTimeframeChange}
        onToggleExpand={handleToggleExpand}
        onCandleTypeChange={handleCandleTypeChange}
        onOpenSearch={handleOpenSearch}
        dashboardColumn={
          enableDashboard ? (
            <DashboardColumn
              activeTicker={activeTicker}
              instrumentMeta={stateInstrumentMeta || instrumentMeta}
              lastCandleData={lastCandleData}
            />
          ) : null
        }
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
  instrumentMeta: PropTypes.object,
  query: PropTypes.string,
};

const MemoizedChartContent = memo(ChartContent, (prevProps, nextProps) => {
  return (
    prevProps.onIntervalChange === nextProps.onIntervalChange &&
    prevProps.onTimeframeChange === nextProps.onTimeframeChange &&
    prevProps.onToggleExpand === nextProps.onToggleExpand &&
    prevProps.onToggleSearch === nextProps.onToggleSearch &&
    prevProps.onSearch === nextProps.onSearch &&
    prevProps.instrumentMeta === nextProps.instrumentMeta &&
    prevProps.query === nextProps.query
  );
});

export default MemoizedChartContent;
