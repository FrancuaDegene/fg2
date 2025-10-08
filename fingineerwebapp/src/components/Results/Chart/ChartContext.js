import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// Action types
const actionTypes = {
  SET_CHART_DATA: 'SET_CHART_DATA',
  SET_CHART_LOADING: 'SET_CHART_LOADING',
  SET_INTERVAL: 'SET_INTERVAL',
  SET_TIMEFRAME: 'SET_TIMEFRAME',
  SET_EXPANDED: 'SET_EXPANDED',
  SET_CANDLE_TYPE: 'SET_CANDLE_TYPE',
  TOGGLE_INDICATOR: 'TOGGLE_INDICATOR',
  REMOVE_INDICATOR: 'REMOVE_INDICATOR',
  TOGGLE_VISIBILITY: 'TOGGLE_VISIBILITY',
};

// Reducer
function chartReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_CHART_DATA: {
      const payload = action.payload || { candles: [], error: null };
      const prev = state.chartData || { candles: [], error: null };

      const payloadLen = Array.isArray(payload.candles) ? payload.candles.length : 0;
      const prevLen = Array.isArray(prev.candles) ? prev.candles.length : 0;

      const payloadErr = payload.error ?? null;
      const prevErr = prev.error ?? null;

      // Если данные те же — возвращаем старый state
      if (payloadLen === prevLen && payloadErr === prevErr) {
        return state;
      }

      return {
        ...state,
        chartData: payload,
        isChartLoading: false,
      };
    }

    case actionTypes.SET_CHART_LOADING: {
      const loading = Boolean(action.payload);
      if (Boolean(state.isChartLoading) === loading) {
        return state;
      }
      return { ...state, isChartLoading: loading };
    }

    case actionTypes.SET_INTERVAL:
      if (state.currentInterval === action.payload) return state;
      return { ...state, currentInterval: action.payload };

    case actionTypes.SET_TIMEFRAME:
      if (state.currentTimeframe === action.payload) return state;
      return { ...state, currentTimeframe: action.payload };

    case actionTypes.SET_EXPANDED:
      if (state.isExpanded === action.payload) return state;
      return { ...state, isExpanded: action.payload };

    case actionTypes.SET_CANDLE_TYPE:
      if (state.currentCandleType === action.payload) return state;
      return { ...state, currentCandleType: action.payload };
      
    // ChartContext.js (внутри chartReducer)

case actionTypes.TOGGLE_INDICATOR: {
  // Ищем существующий индикатор по action.payload.id
  const exists = state.activeIndicators.find(i => i.id === action.payload.id);

  if (exists) {
    // Если нашли - удаляем его
    return { 
      ...state, 
      activeIndicators: state.activeIndicators.filter(i => i.id !== action.payload.id) 
    };
  } else {
    // Если не нашли - добавляем, устанавливая флаг видимости
    return { 
      ...state, 
      activeIndicators: [...state.activeIndicators, { ...action.payload, visible: true }] 
    };
  }
}

    case actionTypes.REMOVE_INDICATOR:
      return { ...state, activeIndicators: state.activeIndicators.filter(i => i.id !== action.payload) };

    case actionTypes.TOGGLE_VISIBILITY:
      return {
        ...state,
        activeIndicators: state.activeIndicators.map(i =>
          i.id === action.payload ? { ...i, visible: !i.visible } : i
        ),
      };

    default:
      return state;
  }
}

// Context
const ChartContext = createContext(null);

// Provider
export const ChartProvider = ({ children, initialData }) => {
  const [state, dispatch] = useReducer(chartReducer, {
    chartData: initialData?.chartData || { candles: [], error: null },
    isChartLoading: initialData?.isChartLoading || false,
    currentInterval: initialData?.currentInterval || '1m',
    currentTimeframe: initialData?.currentTimeframe || '1d',
    isExpanded: initialData?.isExpanded || false,
    currentCandleType: initialData?.currentCandleType || 'candlestick',
    activeIndicators: [],
  });

  // Actions
  const setChartData = useCallback((data) => {
    dispatch({ type: actionTypes.SET_CHART_DATA, payload: data });
  }, []);

  const setChartLoading = useCallback((loading) => {
    dispatch({ type: actionTypes.SET_CHART_LOADING, payload: loading });
  }, []);

  const setInterval = useCallback((interval) => {
    dispatch({ type: actionTypes.SET_INTERVAL, payload: interval });
  }, []);

  const setTimeframe = useCallback((timeframe) => {
    dispatch({ type: actionTypes.SET_TIMEFRAME, payload: timeframe });
  }, []);

  const setExpanded = useCallback((expanded) => {
    dispatch({ type: actionTypes.SET_EXPANDED, payload: expanded });
  }, []);

  const setCandleType = useCallback((candleType) => {
    dispatch({ type: actionTypes.SET_CANDLE_TYPE, payload: candleType });
  }, []);
  // Actions
const toggleIndicator = useCallback((indicator) => {
  dispatch({ type: actionTypes.TOGGLE_INDICATOR, payload: indicator });
}, []);

const removeIndicator = useCallback((id) => {
  dispatch({ type: actionTypes.REMOVE_INDICATOR, payload: id });
}, []);

const toggleIndicatorVisibility = useCallback((id) => {
  dispatch({ type: actionTypes.TOGGLE_VISIBILITY, payload: id });
}, []);

  

const value = useMemo(
  () => ({
    ...state,
    setChartData,
    setChartLoading,
    setInterval,
    setTimeframe,
    setExpanded,
    setCandleType,
    toggleIndicator,
    removeIndicator,
    toggleIndicatorVisibility,
  }),
  [
    state,
    setChartData,
    setChartLoading,
    setInterval,
    setTimeframe,
    setExpanded,
    setCandleType,
    toggleIndicator,
    removeIndicator,
    toggleIndicatorVisibility,
  ]
);

return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
};


// Hook
export const useChart = () => {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChart must be used within a ChartProvider');
  return ctx;
};
