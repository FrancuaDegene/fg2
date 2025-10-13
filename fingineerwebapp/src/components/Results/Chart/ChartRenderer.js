// ChartRenderer.js
import React, { useEffect, useState } from 'react';
import ChartToolbar from './ChartToolbar';
import ChartCanvas from './ChartCanvas';
import './ChartModal.css';
import { TOOL_IDS } from './DrawToolbar';
import ChartShell from './ChartShell';
import TickerCard from './TickerCard';
import './ChartLayout.css';

const ChartRenderer = ({
  chartData,
  currentSymbol,
  currentExchange,
  lastPrice,
  changePct,
  currency,
  dayVolume,
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
  // ⬇️ state панели рисовалок — здесь, а не в ChartShell
  const [activeTool, setActiveTool] = useState(TOOL_IDS.SELECT);
  // ⬇️ работаем без правой рельсы (потом включим)
  const hasRightRail = false;

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
              symbol={currentSymbol || "SBER"}
              exchange={currentExchange || "MOEX"}
              price={lastPrice ?? 159.85}
              changePct={changePct ?? 1.26}
              currency={currency || "RUB"}
              volume={dayVolume ?? 38200000}
              onClick={onOpenSearch}
            />
          </div>
        )}
        {/* полупрозрачный «scrim» под капсулами тулбара */}
        <div className="toolbar-scrim" aria-hidden="true" />

        <div className="global-rail" aria-hidden="true" />

        <div className="chart-separator" />
        <ChartShell
          isExpanded={isExpanded}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          hasRightRail={hasRightRail}
        >
          <ChartCanvas
            key={isExpanded ? 'expanded' : 'normal'}
            chartData={chartData}
            currentInterval={currentInterval}
            currentTimeframe={currentTimeframe}
            currentCandleType={currentCandleType}
            isChartLoading={isChartLoading}
            isExpanded={isExpanded}
          />
        </ChartShell>
      </div>
    </div>
  );
};
      
export default ChartRenderer;



















