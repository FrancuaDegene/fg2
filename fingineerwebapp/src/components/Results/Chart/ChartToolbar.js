import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

// Сторонние библиотеки
import {
  Search,
  Timer,
  BarChart3,
  Calendar,
  LineChart,
  Settings,
  Camera,
  Maximize,
} from 'lucide-react';

// Константы
import { CHART_CONFIG } from '../../../constants';

// Компоненты проекта
import useDropdown from '../../Primitives/useDropdown';
import { useChart } from './ChartContext';

// Стили
import './toolbar/index.css';

/* --- Мини-иконки под виды графика (16x16, наследуют currentColor) --- */
const IconCandles = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 3v10M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="2.5" y="5" width="3" height="6" rx="1" fill="currentColor" opacity=".9"/>
    <rect x="10.5" y="6" width="3" height="4" rx="1" fill="currentColor" opacity=".9"/>
  </svg>
);

const IconHollowCandles = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 3v10M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="2.5" y="5" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="10.5" y="6" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const IconBars = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 11V5M7 13V3M11 10V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconLine = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 11l3-3 2 2 4-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconArea = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 11l4-4 2 2 4-5 2 2v5H2z" fill="currentColor" opacity=".85"/>
  </svg>
);

/* --- Метаданные видов графика: имя + иконка --- */
const CANDLE_TYPE_META = {
  candlestick:        { title: 'Японские свечи',   icon: <IconCandles /> },
  hollow_candlestick: { title: 'Пустые свечи',     icon: <IconHollowCandles /> },
  bars:               { title: 'Бары',             icon: <IconBars /> },
  line:               { title: 'Линия',            icon: <IconLine /> },
  area:               { title: 'Область',          icon: <IconArea /> },
};

/* Список для рендера меню (value + title) */
const candleTypes = Object.entries(CANDLE_TYPE_META).map(([value, v]) => ({
  value,
  title: v.title,
}));

/* Утилиты: получить иконку/название по value */
const iconForType = (type) => CANDLE_TYPE_META[type]?.icon ?? <IconLine />;
const titleForType = (type) => CANDLE_TYPE_META[type]?.title ?? 'График';


const ChartToolbar = ({
  currentInterval,
  onIntervalChange,
  currentTimeframe,
  onTimeframeChange,
  currentCandleType,
  onCandleTypeChange,
  onToggleExpand,
  onOpenSearch,
  isExpanded = false,
}) => {
  // из контекста: список активных индикаторов и переключатель
  const { activeIndicators = [], toggleIndicator } = useChart();

  // локальные состояния выпадашек
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isIndicatorOpen, setIsIndicatorOpen] = useState(false);
  const [isCandleTypeOpen, setIsCandleTypeOpen] = useState(false);

  const {
    isOpen: isTfOpen,
    toggle: toggleTf,
    close: closeTf,
    anchorRef: tfAnchorRef,
    contentRef: tfContentRef,
  } = useDropdown(false);

  const {
    isOpen: isIntOpen,
    toggle: toggleInt,
    close: closeInt,
    anchorRef: intAnchorRef,
    contentRef: intContentRef,
  } = useDropdown(false);

  // рефы для закрытия по клику вне
  const candleTypeRef = useRef(null);
  const calendarRef = useRef(null);
  const indicatorRef = useRef(null);

  const intervals = CHART_CONFIG.INTERVALS;
  const timeframes = CHART_CONFIG.TIMEFRAMES;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (candleTypeRef.current && !candleTypeRef.current.contains(event.target)) setIsCandleTypeOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target)) setIsCalendarOpen(false);
      if (indicatorRef.current && !indicatorRef.current.contains(event.target)) setIsIndicatorOpen(false);
    };

    const handleScroll = () => {
      setIsCandleTypeOpen(false);
      setIsCalendarOpen(false);
      setIsIndicatorOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // если выходим из fullscreen — закрыть календарь
  useEffect(() => {
    if (!isExpanded) setIsCalendarOpen(false);
  }, [isExpanded]);

 

  const indicators = [
    { id: 'ma', label: 'Moving Average (MA)', color: '#2962ff', params: { period: 20 } },
    { id: 'ema', label: 'Exponential MA (EMA)', color: '#ff9800', params: { period: 20 } },
    { id: 'rsi', label: 'RSI', color: '#f44336', params: { period: 14 } },
  ];

  const formatDate = (date) => (date ? date : new Date().toISOString().split('T')[0]);

  const handleDateChange = () => setIsCalendarOpen(false);

  const handleIntervalChange = (intervalId) => {
    if (onIntervalChange) onIntervalChange(intervalId);
    closeInt();
  };

  const handleTimeframeChange = (timeframeId) => {
    if (onTimeframeChange) onTimeframeChange(timeframeId);
    closeTf();
  };

  const handleCandleTypeChange = (candleTypeValue) => {
    if (onCandleTypeChange) onCandleTypeChange(candleTypeValue);
    setIsCandleTypeOpen(false);
  };

  const handleToggleExpand = () => {
    if (onToggleExpand) onToggleExpand(!isExpanded);
  };

  const handleSearchClick = () => {
    if (typeof onOpenSearch === 'function') {
      onOpenSearch();
    }
  };

  const handleIndicatorToggle = useCallback(
    (indicator) => {
      toggleIndicator(indicator);
    },
    [toggleIndicator]
  );

  return (
    <div
      className={`chart-toolbar ${isExpanded ? 'expanded' : 'normal'}`}
      data-expanded={isExpanded ? '1' : undefined}
    >
      {/* ====== NAVIGATION ====== */}
      <div className="tb__group tb__group--navigation">
        {isExpanded && (
          <button className="tb-btn tb-btn--icon" onClick={handleSearchClick} aria-label="Поиск">
            <Search size={18} />
            <span className="tooltip">Поиск</span>
          </button>
        )}

        <div className="dropdown-container tb-dd" ref={intAnchorRef}>
          <button
            className="tb-btn tb-btn--with-text"
            onClick={toggleInt}
            aria-expanded={isIntOpen}
          >
            <Timer size={16} /> {intervals.find((int) => int.id === currentInterval)?.id || '1m'}
          </button>

          {isIntOpen && (
            <div className="dropdown-menu" ref={intContentRef}>
              {intervals.map((interval) => (
                <button
                  key={interval.id}
                  className="tb-dd__item"
                  data-state={currentInterval === interval.id ? 'active' : undefined}
                  onClick={() => handleIntervalChange(interval.id)}
                  title={interval.label}
                >
                  <span className="tb-dd__label">{interval.label}</span>
                  {currentInterval === interval.id && <span className="tb-dd__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tb-separator" />

        <div className="dropdown-container tb-dd" ref={tfAnchorRef}>
          <button
            className="tb-btn tb-btn--with-text"
            onClick={toggleTf}
            aria-expanded={isTfOpen}
          >
            <BarChart3 size={16} /> {timeframes.find((tf) => tf.id === currentTimeframe)?.id || '1d'}
          </button>

          {isTfOpen && (
            <div className="dropdown-menu" ref={tfContentRef}>
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe.id}
                  className="tb-dd__item"
                  data-state={currentTimeframe === timeframe.id ? 'active' : undefined}
                  onClick={() => handleTimeframeChange(timeframe.id)}
                  title={timeframe.label}
                >
                  <span className="tb-dd__label">{timeframe.label}</span>
                  {currentTimeframe === timeframe.id && <span className="tb-dd__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>{/* /tb__group--navigation */}

      <div className="tb-separator" />

      {/* ====== VIEW ====== */}
      <div className="tb__group tb__group--view">
        <div className="dropdown-container tb-dd" ref={candleTypeRef}>
          {/* было icon-btn-with-text */}
          <button
            className="tb-btn tb-btn--icon"
            onClick={() => setIsCandleTypeOpen(!isCandleTypeOpen)}
            aria-expanded={isCandleTypeOpen}
            aria-label={titleForType(currentCandleType)}
            title={titleForType(currentCandleType)}
          >
            {iconForType(currentCandleType)}
            <span className="tooltip">{titleForType(currentCandleType)}</span>
          </button>

          {isCandleTypeOpen && (
            <div className="dropdown-menu" ref={tfContentRef /* лучше завести отдельный candleMenuRef */}>
              {candleTypes.map((type) => {
                const active = currentCandleType === type.value;
                return (
                  <button
                    key={type.value}
                    className={`dropdown-option ${active ? 'active' : ''}`}
                    onClick={() => handleCandleTypeChange(type.value)}
                    title={type.title}
                    role="menuitemradio"
                    aria-checked={active}
                    data-active={active ? '1' : '0'}
                  >
                    <span className="tb-dd__icon">{iconForType(type.value)}</span>
                    <span className="tb-dd__label">{type.title}</span>
                    {active && <span className="tb-dd__check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="tb-separator" />

      {/* ====== ANALYSIS ====== */}
      <div className="tb__group tb__group--analysis">
        {isExpanded && (
          <div className="dropdown-container tb-dd" ref={calendarRef}>
            <button className="tb-btn tb-btn--icon" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
              <Calendar size={18} />
              <span className="tooltip">Календарь</span>
            </button>

            {isCalendarOpen && (
              <div className="date-picker-dropdown">
                <input
                  type="date"
                  defaultValue={formatDate(new Date().toISOString().split('T')[0])}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={handleDateChange}
                />
                <button className="date-today-btn" onClick={() => setIsCalendarOpen(false)}>
                  Сегодня
                </button>
              </div>
            )}
          </div>
        )}

        <div className="dropdown-container tb-dd" ref={indicatorRef}>
          <button
            className="tb-btn tb-btn--with-text"
            onClick={() => setIsIndicatorOpen(!isIndicatorOpen)}
            aria-expanded={isIndicatorOpen}
          >
            <LineChart size={16} /> Индикаторы
          </button>

          {isIndicatorOpen && (
            <div className="dropdown-menu" role="menu">
              {indicators.map((indicator) => {
                const isActive = activeIndicators?.some((i) => i?.id === indicator.id);
                return (
                  <button
                    key={indicator.id}
                    className={`dropdown-option ${isActive ? 'active' : ''}`}
                    onClick={() => handleIndicatorToggle(indicator)}
                    role="menuitemcheckbox"
                    title={indicator.label}
                    aria-checked={isActive}
                    data-active={isActive ? '1' : '0'}
                  >
                    <span className="tb-dd__icon">
                      <LineChart size={16} />
                    </span>
                    <span className="tb-dd__label">{indicator.label}</span>
                    {isActive && <span className="tb-dd__check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="tb-separator" />

      {/* ====== SERVICE ====== */}
      <div className="tb__group tb__group--service" style={{ marginLeft: 'auto' }}>
        <button className="tb-btn tb-btn--icon" aria-label="Скриншот">
          <Camera size={18} />
          <span className="tooltip">Скриншот</span>
        </button>
        <button className="tb-btn tb-btn--icon" aria-label="Настройки">
          <Settings size={18} />
          <span className="tooltip">Настройки</span>
        </button>
        <button className="icon-btn expand-btn" onClick={handleToggleExpand} aria-label="Развернуть">
          <Maximize size={18} />
          <span className="tooltip">Развернуть</span>
        </button>
      </div>
    </div>
  );


};

const areEqual = (prevProps, nextProps) =>
  prevProps.currentInterval === nextProps.currentInterval &&
  prevProps.currentTimeframe === nextProps.currentTimeframe &&
  prevProps.currentCandleType === nextProps.currentCandleType &&
  prevProps.isExpanded === nextProps.isExpanded &&
  prevProps.onIntervalChange === nextProps.onIntervalChange &&
  prevProps.onTimeframeChange === nextProps.onTimeframeChange &&
  prevProps.onCandleTypeChange === nextProps.onCandleTypeChange &&
  prevProps.onToggleExpand === nextProps.onToggleExpand &&
  prevProps.onOpenSearch === nextProps.onOpenSearch;

export default memo(ChartToolbar, areEqual);
















            
