import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { resolveTimeframeForCompact } from '../../../utils/chart/timeframes';

// Action types
const actionTypes = {
  SET_CHART_DATA: 'SET_CHART_DATA',
  SET_CHART_LOADING: 'SET_CHART_LOADING',
  SET_INTERVAL: 'SET_INTERVAL',
  SET_TIMEFRAME: 'SET_TIMEFRAME',
  SET_EXPANDED: 'SET_EXPANDED',
  SET_CANDLE_TYPE: 'SET_CANDLE_TYPE',
  SET_ACTIVE_TICKER: 'SET_ACTIVE_TICKER',
  SET_INSTRUMENT_META: 'SET_INSTRUMENT_META',
  SET_LAST_CANDLE: 'SET_LAST_CANDLE',
  SET_CHART_META: 'SET_CHART_META',
  SET_CANVAS_METRICS: 'SET_CANVAS_METRICS',
  TOGGLE_INDICATOR: 'TOGGLE_INDICATOR',
  REMOVE_INDICATOR: 'REMOVE_INDICATOR',
  TOGGLE_VISIBILITY: 'TOGGLE_VISIBILITY',
  UPDATE_INDICATOR: 'UPDATE_INDICATOR',
};

// safety cap: держим не больше ~60k баров в памяти
const MAX_BARS_PER_SERIES = 60000;

// Reducer
function chartReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_CHART_DATA: {
      const payload = action.payload || {};

      // исходный массив свечей из payload
      const arr = Array.isArray(payload.candles) ? payload.candles : [];
      // сохраняем ограничение по количеству баров, как было
      const capped =
        arr.length > MAX_BARS_PER_SERIES ? arr.slice(-MAX_BARS_PER_SERIES) : arr;

      // базовые поля chartData
      const nextChartData = {
        // сохраняем существующие поля, чтобы не терять доп. данные из контекста
        ...(state.chartData || {}),
        candles: capped,
        error: payload.error ?? null,
      };

      // 👇 ключевой момент: не выбрасываем loadMoreHistory
      if (typeof payload.loadMoreHistory === 'function') {
        nextChartData.loadMoreHistory = payload.loadMoreHistory;
      } else if ('loadMoreHistory' in payload) {
        // если явно пришёл null/undefined — тоже пробрасываем
        nextChartData.loadMoreHistory = payload.loadMoreHistory;
      }

      return {
        ...state,
        chartData: nextChartData,
      };
    }

    case actionTypes.SET_CHART_LOADING: {
      const loading = Boolean(action.payload);
      if (Boolean(state.isChartLoading) === loading) {
        return state;
      }
      return { ...state, isChartLoading: loading };
    }

    case actionTypes.SET_CHART_META:
      return { ...state, chartMeta: { ...state.chartMeta, ...(action.payload || {}) } };

    case actionTypes.SET_CANVAS_METRICS:
      return { ...state, canvasMetrics: { ...state.canvasMetrics, ...(action.payload || {}) } };

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

    case actionTypes.SET_ACTIVE_TICKER:
      if (state.activeTicker === action.payload) return state;
      return { ...state, activeTicker: action.payload ?? null };

    case actionTypes.SET_INSTRUMENT_META:
      if (state.instrumentMeta === action.payload) return state;
      return { ...state, instrumentMeta: action.payload ?? null };

    case actionTypes.SET_LAST_CANDLE:
      if (state.lastCandleData === action.payload) return state;
      return { ...state, lastCandleData: action.payload ?? null };

    // ChartContext.js (внутри chartReducer)

    case actionTypes.TOGGLE_INDICATOR: {
      const indicator = action.payload;
      if (!indicator || !indicator.id) return state;
      const exists = state.activeIndicators.find((i) => i.id === indicator.id);

      if (exists) {
        return {
          ...state,
          activeIndicators: state.activeIndicators.filter((i) => i.id !== indicator.id),
        };
      }

      const BOTTOM_INDICATORS = new Set(['volume', 'rsi']);
      const sanitizedIndicator = {
        ...indicator,
        visible: true,
        params: indicator.params ? { ...indicator.params } : undefined,
        settings: indicator.settings
          ? { ...indicator.settings }
          : indicator.id === 'rsi'
          ? { showLevels: true }
          : undefined,
      };

      const nextIndicators = state.activeIndicators.filter((i) => {
        if (!BOTTOM_INDICATORS.has(indicator.id)) return true;
        return !BOTTOM_INDICATORS.has(i.id);
      });

      return {
        ...state,
        activeIndicators: [...nextIndicators, sanitizedIndicator],
      };
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

    case actionTypes.UPDATE_INDICATOR: {
      const { id, patch } = action.payload || {};
      if (!id || !patch) return state;
      let changed = false;
      const nextIndicators = state.activeIndicators.map((indicator) => {
        if (indicator.id !== id) return indicator;
        changed = true;
        const { params: paramsPatch, settings: settingsPatch, ...rest } = patch;
        return {
          ...indicator,
          ...rest,
          params: paramsPatch
            ? { ...(indicator.params || {}), ...paramsPatch }
            : indicator.params,
          settings: settingsPatch
            ? { ...(indicator.settings || {}), ...settingsPatch }
            : indicator.settings,
        };
      });
      if (!changed) return state;
      return { ...state, activeIndicators: nextIndicators };
    }

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
    chartMeta: initialData?.chartMeta || { dataResolution: 'auto', sourceInterval: null, isDownsampled: false, points: null },
    canvasMetrics: initialData?.canvasMetrics || { width: null, dpr: null },
    currentInterval: initialData?.currentInterval || '1m',
    currentTimeframe: initialData?.currentTimeframe || '1d',
    isExpanded: initialData?.isExpanded || false,
    currentCandleType: initialData?.currentCandleType || 'candlestick',
    activeIndicators: [],
    activeTicker: initialData?.activeTicker ?? null,
    instrumentMeta: initialData?.instrumentMeta ?? null,
    lastCandleData: initialData?.lastCandleData ?? null,
  });

  // Actions
  const setChartData = useCallback((data) => {
    dispatch({ type: actionTypes.SET_CHART_DATA, payload: data });
  }, []);

  const setChartLoading = useCallback((loading) => {
    dispatch({ type: actionTypes.SET_CHART_LOADING, payload: loading });
  }, []);

  const setChartMeta = useCallback((chartMeta) => {
    dispatch({ type: actionTypes.SET_CHART_META, payload: chartMeta });
  }, []);

  const setCanvasMetrics = useCallback((metrics) => {
    dispatch({ type: actionTypes.SET_CANVAS_METRICS, payload: metrics });
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

  const setActiveTicker = useCallback((ticker) => {
    dispatch({ type: actionTypes.SET_ACTIVE_TICKER, payload: ticker });
  }, []);

  const setInstrumentMeta = useCallback((meta) => {
    dispatch({ type: actionTypes.SET_INSTRUMENT_META, payload: meta });
  }, []);

  const setLastCandleData = useCallback((candle) => {
    dispatch({ type: actionTypes.SET_LAST_CANDLE, payload: candle });
  }, []);

  const effectiveTimeframe = useMemo(() => {
    if (!state.isExpanded) {
      return state.currentTimeframe;
    }
    return state.currentTimeframe;
  }, [state.isExpanded, state.currentInterval, state.currentTimeframe]);

  const toggleIndicator = useCallback((indicator) => {
    dispatch({ type: actionTypes.TOGGLE_INDICATOR, payload: indicator });
  }, []);

  const removeIndicator = useCallback((id) => {
    dispatch({ type: actionTypes.REMOVE_INDICATOR, payload: id });
  }, []);

  const toggleIndicatorVisibility = useCallback((id) => {
    dispatch({ type: actionTypes.TOGGLE_VISIBILITY, payload: id });
  }, []);

  const updateIndicator = useCallback((id, patch) => {
    if (!id || !patch) return;
    dispatch({ type: actionTypes.UPDATE_INDICATOR, payload: { id, patch } });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      state,
      setChartData,
      setChartLoading,
      setChartMeta,
      setCanvasMetrics,
      setInterval,
      setTimeframe,
      setExpanded,
      setCandleType,
      setActiveTicker,
      setInstrumentMeta,
      setLastCandleData,
      effectiveTimeframe,
      toggleIndicator,
      removeIndicator,
      toggleIndicatorVisibility,
      updateIndicator,
      dispatch,
    }),
    [
      state,
      setChartData,
      setChartLoading,
      setChartMeta,
      setCanvasMetrics,
      setInterval,
      setTimeframe,
      setExpanded,
      setCandleType,
      setActiveTicker,
      setInstrumentMeta,
      setLastCandleData,
      effectiveTimeframe,
      toggleIndicator,
      removeIndicator,
      toggleIndicatorVisibility,
      updateIndicator,
      dispatch,
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

export const useChartState = () => {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChartState must be used within a ChartProvider');
  return ctx.state ?? {};
};

export const useChartDispatch = () => {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChartDispatch must be used within a ChartProvider');
  return ctx.dispatch;
};
