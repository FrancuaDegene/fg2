import React from 'react';
import PropTypes from 'prop-types';
import CompanyInfo from './CompanyInfo/CompanyInfo';
import Price from './Price/Price';
import Chart from './Chart/Chart';
import News from './News/News';
import KeyMetrics from './KeyMetrics/KeyMetrics';
import Dividends from './Dividends/Dividends';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import ExpandedControls from '../ExpandedControls/ExpandedControls';
import './Results.css';

const Results = ({
    query,
    data,
    chartData,
    news,
    dividends,
    newsContainerRef,
    toggleNews,
    currentTimeframe,
    onSelectTimeframe,
    selectedDate,
    onSelectDate,
    socket,
    isLoading,
    isChartLoading,
    currentInterval,
    onSelectInterval,
    isChartExpanded,
    sourceAuthority,
    onRestOwnershipSignal,
    isSearchVisible,
    onToggleExpand,
    onToggleSearch,
    onSearch,
}) => {
  // debug logs removed (render-noise)
  
    const hasQuery = Boolean(query && String(query).trim());
    
    // debug gate log removed

    const handleToggleExpand = (value) => {
        if (onToggleExpand && typeof onToggleExpand === 'function') {
            onToggleExpand(value);
        }
    };

    const handleSearch = (query) => {
        if (onSearch && typeof onSearch === 'function') {
            onSearch(query);
        }
    };

    const handleSelectInterval = (interval) => {
        if (onSelectInterval && typeof onSelectInterval === 'function') {
            onSelectInterval(interval);
        }
    };

    const handleSelectTimeframe = (timeframe) => {
        if (onSelectTimeframe && typeof onSelectTimeframe === 'function') {
            onSelectTimeframe(timeframe);
        }
    };

    if (isLoading && !hasQuery) {
        return <LoadingSkeleton />;
    }

    // ✅ FIXED: Если нет query (тикера) → показывать только поиск
    if (!hasQuery) {
        return null;
    }

    if (data?.error) {
        console.log('[FG][Results][earlyReturn][error]', {
          error: data.error,
        });
        return <div className="error">{data.error}</div>;
    }

    // debug render START log removed

    // debug render logs removed (noise)

    return (
        <div className="results-container">
            <section className="compact-results-shell">
                <div className="compact-results-shell__primary">
                    <div className="compact-results-shell__identity">
                        <div className="company-block">
                            <CompanyInfo data={data} />
                        </div>
                    </div>

                    <section className="compact-results-shell__metrics">
                        <KeyMetrics data={data} />
                    </section>

                    <div className="compact-results-shell__snapshot">
                        <Price data={data} ticker={data?.ticker || ''} />
                    </div>
                </div>

                {isChartExpanded && isSearchVisible && (
                    <div className="compact-results-shell__bridge">
                        <ExpandedControls
                            query={data?.ticker || ''}
                            onSearch={handleSearch}
                            currentTimeframe={currentTimeframe}
                            onSelectTimeframe={handleSelectTimeframe}
                            currentInterval={currentInterval}
                            onSelectInterval={handleSelectInterval}
                            onToggleCalendar={() => {}}
                            onToggleIndicators={() => {}}
                            isExpanded={isChartExpanded}
                        />
                    </div>
                )}

                <div className="compact-results-shell__evidence chart-flex-row">
                    <Chart
                        query={query || data?.ticker || ''}
                        chartData={chartData}
                        data={data}
                        isChartLoading={isChartLoading}
                        selectedDate={selectedDate}
                        socket={socket}
                        currentTimeframe={currentTimeframe}
                        onTimeframeChange={handleSelectTimeframe}
                        currentInterval={currentInterval}
                        onIntervalChange={handleSelectInterval}
                        sourceAuthority={sourceAuthority}
                        onRestOwnershipSignal={onRestOwnershipSignal}
                        isExpanded={isChartExpanded}
                        onToggleExpand={handleToggleExpand}
                        onToggleSearch={onToggleSearch}
                        onSearch={handleSearch}
                    />
                </div>

                <div className="compact-results-shell__secondary">
                    <section className="compact-results-shell__context">
                        <News
                            news={news}
                            newsContainerRef={newsContainerRef}
                            toggleNews={toggleNews}
                        />
                    </section>
                </div>

                {dividends && Array.isArray(dividends) && dividends.length > 0 && (
                    <section className="compact-results-shell__appendix">
                        <Dividends dividends={dividends} />
                    </section>
                )}
            </section>
        </div>
    );
};

Results.propTypes = {
    query: PropTypes.string,
    data: PropTypes.object,
    chartData: PropTypes.object,
    news: PropTypes.array,
    dividends: PropTypes.array,
    newsContainerRef: PropTypes.object,
    toggleNews: PropTypes.func,
    currentTimeframe: PropTypes.string.isRequired,
    onSelectTimeframe: PropTypes.func.isRequired,
    selectedDate: PropTypes.string,
    onSelectDate: PropTypes.func,
    isLoading: PropTypes.bool,
    isChartLoading: PropTypes.bool,
    currentInterval: PropTypes.string.isRequired,
    onSelectInterval: PropTypes.func.isRequired,
    sourceAuthority: PropTypes.oneOf(['app', 'rest']).isRequired,
    isChartExpanded: PropTypes.bool.isRequired,
    onRestOwnershipSignal: PropTypes.func,
    isSearchVisible: PropTypes.bool.isRequired,
    onToggleExpand: PropTypes.func.isRequired,
    onToggleSearch: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    socket: PropTypes.object,
};

export default Results;
