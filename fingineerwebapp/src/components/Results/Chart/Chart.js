import React from 'react'; // Убрали useState, он больше не нужен для этого
import PropTypes from 'prop-types';
import ChartContainer from './ChartContainer';
import './Chart.css';

const Chart = ({
  chartData,
  isChartLoading,
  query,
  onToggleSearch,
  onSearch,
  currentInterval,
  currentTimeframe,
  onIntervalChange,
  onTimeframeChange,
  isExpanded,         // ++ Принимаем состояние снаружи
  onToggleExpand,     // ++ Принимаем обработчик снаружи
}) => {
  // -- Полностью убираем локальное состояние для isExpanded
  // const [isExpanded, setIsExpanded] = useState(false); 
  
  // Локальное состояние для типа свечей можно оставить, так как оно не управляется извне
  const [candleType, setCandleType] = React.useState('candlestick');

  // Обработчики интервала и таймфрейма остаются такими же простыми
  const handleIntervalChange = (newInterval) => {
    if (typeof onIntervalChange === 'function') {
      onIntervalChange(newInterval);
    }
  };

  const handleTimeframeChange = (newTimeframe) => {
    if (typeof onTimeframeChange === 'function') {
      onTimeframeChange(newTimeframe);
    }
  };

  // ++ Создаем правильный обработчик для переключения расширенного режима
  const handleToggleExpand = () => {
    if (typeof onToggleExpand === 'function') {
      // Сообщаем родителю, что состояние нужно инвертировать
      // Родительский обработчик ожидает получить новое значение (true или false)
      onToggleExpand(!isExpanded);
    }
  };

  const handleCandleTypeChange = (newType) => {
    setCandleType(newType);
  };

  return (
    <ChartContainer
      chartData={chartData}
      isChartLoading={isChartLoading}
      currentInterval={currentInterval}
      currentTimeframe={currentTimeframe}
      currentCandleType={candleType}
      onIntervalChange={handleIntervalChange}
      onTimeframeChange={handleTimeframeChange}
      onCandleTypeChange={handleCandleTypeChange}
      query={query}
      isExpanded={isExpanded} // ++ Передаем пропс, который получили
      onToggleExpand={handleToggleExpand} // ++ Передаем наш новый обработчик
      onToggleSearch={onToggleSearch}
      onSearch={onSearch}
    />
  );
};

Chart.propTypes = {
  chartData: PropTypes.shape({
    candles: PropTypes.array,
    error: PropTypes.string,
  }),
  isChartLoading: PropTypes.bool,
  currentInterval: PropTypes.string,
  currentTimeframe: PropTypes.string,
  onIntervalChange: PropTypes.func,
  onTimeframeChange: PropTypes.func,
  query: PropTypes.string.isRequired,
  onToggleSearch: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool, // ++ Добавляем в propTypes
  onToggleExpand: PropTypes.func, // ++ Добавляем в propTypes
};

export default Chart;