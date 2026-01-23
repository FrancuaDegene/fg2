import React from 'react'; // Убрали useState, он больше не нужен для этого
import PropTypes from 'prop-types';
import ChartContainer from './ChartContainer';
// import CompactTrendChart from './CompactTrendChart/CompactTrendChart';
import CompactSparkline from './CompactTrendChart/CompactSparkline';
import CompactToolbar from './CompactToolbar';
import './Chart.css';
import { normalizeExchange } from '../../../utils/normalizeExchange';

// Generic small helpers moved to module scope to keep component hooks' deps stable
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

const Chart = ({
  chartData,
  data,
  isChartLoading,
  query,
  onToggleSearch,
  onSearch,
  currentInterval,
  currentTimeframe,
  selectedDate,
  socket,
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

  const instrumentMeta = React.useMemo(() => {
    const rawSymbol = data?.ticker || query || '';
    const symbol = rawSymbol ? String(rawSymbol).toUpperCase() : (query ? String(query).toUpperCase() : 'SBER');
    const exchange = normalizeExchange(data?.exchange || data?.market || 'MOEX');
    const exchangeShort = data?.exchangeShort ? String(data?.exchangeShort).toUpperCase() : exchange;
    const currency = (data?.currency || data?.currencyCode || 'RUB')?.toString().toUpperCase();

    const symbolId =
      data?.symbolId ||
      (exchange && symbol ? `${String(exchange).toUpperCase()}:${symbol}` : symbol);

    const lastPrice = pickNumber(
      data?.close,
      data?.currentPrice,
      data?.lastPrice,
      data?.price
    );

    const dayChangePct = pickNumber(
      data?.dayChangePct,
      data?.changePercent,
      data?.priceChangePercent,
      data?.change_percentage,
      data?.changePct
    );

    const dayVolume = pickNumber(
      data?.volume,
      data?.dayVolume,
      data?.avgVolume,
      data?.averageVolume
    );

    const prevClose = pickNumber(
      data?.prevClose,
      data?.previousClose,
      data?.prev_close
    );

    const instrumentType = (data?.instrumentType || data?.type || 'stock').toLowerCase();
    const secName = data?.shortName || data?.secName || data?.name || '';
    const instrumentName = data?.name || data?.fullName || secName;
    const board = data?.board || data?.boardCode || data?.primaryBoard || '';
    const lotSize = pickNumber(data?.lotSize, data?.lot, data?.lotsize) || 1;
    const tickSize = pickNumber(data?.tickSize, data?.minPriceIncrement, data?.min_step, data?.stepPrice);
    const displayDecimals = toNumber(data?.displayDecimals ?? data?.pricePrecision ?? data?.decimals);
    const sectorName = data?.sectorName || data?.sectorTitle || data?.sectorLong || data?.sectorLabel || '';
    const industry = data?.industry || data?.industryName || '';
    const sectorCode = data?.sectorCode || data?.sector || '';
    const sector = sectorName || industry || sectorCode || '';
    const country = data?.country || data?.countryCode || '';
    const logoUrl = data?.logoUrl || data?.logo || null;
    const exDivDate = data?.exDivDate || data?.dividendDate || data?.nextDividendDate || data?.dividendNextDate;
    const divNextAmount = pickNumber(data?.dividendAmount, data?.dividendNextAmount, data?.nextDividendValue);
    const session = data?.session || data?.tradingSession || data?.tradeSession || 'main';
    const auction = data?.auction || data?.auctionState || 'none';
    const halted = Boolean(data?.isHalted || data?.halted || data?.suspended);

    return {
      symbol,
      symbolId: symbolId ? String(symbolId).toUpperCase() : symbol,
      exchange,
      exchangeShort,
      currency,
      lastPrice,
      dayChangePct,
      dayVolume,
      prevClose,
      instrumentType,
      secName,
      instrumentName,
      board,
      lotSize,
      tickSize,
      displayDecimals,
      sector,
      sectorName,
      sectorCode,
      industry,
      country,
      logoUrl,
      exDivDate,
      divNextAmount,
      session,
      auction,
      halted,
    };
  }, [data, query]);

  // Compact passport (ticker + last + % by selected range)
  // NOTE: Range-based: first valid close -> last valid close from chartData.candles
  const compactPassport = React.useMemo(() => {
    const candles = Array.isArray(chartData?.candles) ? chartData.candles : [];
    if (candles.length < 2) {
      return { last: null, pct: null };
    }

    let first = null;
    let last = null;
    for (let i = 0; i < candles.length; i += 1) {
      const v = pickNumber(candles[i]?.close, candles[i]?.value);
      if (Number.isFinite(v)) {
        first = v;
        break;
      }
    }
    for (let i = candles.length - 1; i >= 0; i -= 1) {
      const v = pickNumber(candles[i]?.close, candles[i]?.value);
      if (Number.isFinite(v)) {
        last = v;
        break;
      }
    }

    if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) {
      return { last: Number.isFinite(last) ? last : null, pct: null };
    }
    const pct = ((last - first) / first) * 100;
    return { last, pct };
  }, [chartData]);

  const [hoverPrice, setHoverPrice] = React.useState(null);
  const [hoverPct, setHoverPct] = React.useState(null);

  const handleCompactHover = React.useCallback((payload) => {
    if (!payload) {
      setHoverPrice(null);
      setHoverPct(null);
      return;
    }
    const nextPrice = Number.isFinite(payload?.close) ? payload.close : null;
    const nextPct = Number.isFinite(payload?.pct) ? payload.pct : null;
    setHoverPrice(nextPrice);
    setHoverPct(nextPct);
  }, []);

  const displayLast = Number.isFinite(hoverPrice) ? hoverPrice : compactPassport.last;
  const displayPct = Number.isFinite(hoverPct) ? hoverPct : compactPassport.pct;

  return (
    <div style={{ position: 'relative' }}>
      {isExpanded ? (
        <ChartContainer
          chartData={chartData}
          instrumentMeta={instrumentMeta}
          isChartLoading={isChartLoading}
          currentInterval={currentInterval}
          currentTimeframe={currentTimeframe}
          currentCandleType={candleType}
          selectedDate={selectedDate}
          socket={socket}
          onIntervalChange={handleIntervalChange}
          onTimeframeChange={handleTimeframeChange}
          onCandleTypeChange={handleCandleTypeChange}
          query={query}
          isExpanded={isExpanded} // ++ Передаем пропс, который получили
          onToggleExpand={handleToggleExpand} // ++ Передаем наш новый обработчик
          onToggleSearch={onToggleSearch}
          onSearch={onSearch}
        />
      ) : (
        <div className="chart-wrapper">
          <div className="chart-container">
            <CompactToolbar
              currentRange={currentTimeframe}
              onSelectRange={handleTimeframeChange}
              onToggleExpand={handleToggleExpand}
              ticker={query}
              lastPrice={displayLast}
              deltaPct={displayPct}
            />
            <CompactSparkline
              chartData={chartData}
              ticker={query}
              range={currentTimeframe}
              onHoverChange={handleCompactHover}
            />
          </div>
        </div>
      )}
    </div>
  );
};

Chart.propTypes = {
  chartData: PropTypes.shape({
    candles: PropTypes.array,
    error: PropTypes.string,
  }),
  data: PropTypes.object,
  isChartLoading: PropTypes.bool,
  currentInterval: PropTypes.string,
  currentTimeframe: PropTypes.string,
  selectedDate: PropTypes.string,
  socket: PropTypes.object,
  onIntervalChange: PropTypes.func,
  onTimeframeChange: PropTypes.func,
  query: PropTypes.string.isRequired,
  onToggleSearch: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool, // ++ Добавляем в propTypes
  onToggleExpand: PropTypes.func, // ++ Добавляем в propTypes
};

export default Chart;
