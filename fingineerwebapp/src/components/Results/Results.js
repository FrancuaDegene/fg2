import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CompanyInfo from './CompanyInfo/CompanyInfo';
import TickerInfoPanel from './TickerInfoPanel/TickerInfoPanel';
import Price from './Price/Price';
import Chart from './Chart/Chart';
import News from './News/News';
import KeyMetrics from './KeyMetrics/KeyMetrics';
import Dividends from './Dividends/Dividends';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import { AnimatePresence, motion } from 'framer-motion';
import ExpandedControls from '../ExpandedControls/ExpandedControls';
import './Results.css';

const Results = ({
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
    isLoading,
    isChartLoading,
    currentInterval,
    onSelectInterval,
    isChartExpanded,
    isSearchVisible,
    onToggleExpand,
    onToggleSearch,
    onSearch,
}) => {
  
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        setIsPanelOpen(false);
    }, [data]);

    const handleTickerClick = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
    };

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

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!data) {
        return null;
    }

    if (data.error) {
        return <div className="error">{data.error}</div>;
    }

    console.log('Results rendering with chartData:', chartData);
    console.log('Results rendering with isChartExpanded:', isChartExpanded);

    return (
        <div className="results-container">
            <div className="results-row">
                <div className="company-block">
                    <CompanyInfo data={data} onTickerClick={handleTickerClick} />
                    <AnimatePresence>
                        {isPanelOpen && (
                            <motion.div
                                className="ticker-info-wrapper"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ type: "tween", duration: 0.5 }}
                            >
                                <TickerInfoPanel
                                    ticker={data.ticker}
                                    details={{
                                        sector: data.sector || '—',
                                        exchange: data.exchange || '—',
                                        dividendYield: data.dividendYield || '—',
                                    }}
                                    onClose={handleClosePanel}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Price data={data} ticker={data.ticker} />
                </div>
            </div>

            {/* Панель управления только если график расширен и поиск активен */}
            {isChartExpanded && isSearchVisible && (
            <ExpandedControls
        query={data.ticker}
        onSearch={handleSearch}
        currentTimeframe={currentTimeframe}
        onSelectTimeframe={handleSelectTimeframe}
        currentInterval={currentInterval}
        onSelectInterval={handleSelectInterval}
        onToggleCalendar={() => {}}
        onToggleIndicators={() => {}}
        isExpanded={isChartExpanded} 
    />
)}

            <div className="chart-flex-row">
                <Chart
                    query={data.ticker}
                    chartData={chartData}
                    data={data}
                    isChartLoading={isChartLoading}
                    currentTimeframe={currentTimeframe}
                    onTimeframeChange={handleSelectTimeframe}
                    currentInterval={currentInterval}
                    onIntervalChange={handleSelectInterval}
                    isExpanded={isChartExpanded}
                    onToggleExpand={handleToggleExpand}
                    onToggleSearch={onToggleSearch}
                    onSearch={handleSearch}
                />
            </div>

            <div className="results-row">
                <KeyMetrics data={data} />
                <News
                    news={news}
                    newsContainerRef={newsContainerRef}
                    toggleNews={toggleNews}
                />
            </div>

            {dividends && Array.isArray(dividends) && dividends.length > 0 && (
                <Dividends dividends={dividends} />
            )}
        </div>
    );
};

Results.propTypes = {
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
    isChartExpanded: PropTypes.bool.isRequired,
    isSearchVisible: PropTypes.bool.isRequired,
    onToggleExpand: PropTypes.func.isRequired,
    onToggleSearch: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
};

export default Results;