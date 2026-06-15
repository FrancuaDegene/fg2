import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import config from './config/api';
import AiTestButton from './components/AiTestButton';
import AiStreamButton from './components/AiStreamButton';
// Импорт компонентов
import Header from './components/Header.js';
import SearchForm from './components/SearchForm';
import SearchModal from './components/SearchModal/SearchModal';
import Results from './components/Results/Results';
import LoadingSkeleton from './components/LoadingSkeleton/LoadingSkeleton';
import './App.css';
import Overlay from './components/Overlay/Overlay';
import { fixIntervalForTimeframe } from './constants';

// TEMP/Safety: aliases for legacy compact timeframe ids -> backend contract
// Backend candlesSocket.js expects: 1d, 5d, 1mth, 3mth, 6mth, 1y, all
const TF_ALIAS = {
    '1m': '1mth',
    '3m': '3mth',
    '6m': '6mth',
};
const normalizeTimeframeForSocket = (tf) => {
    const s = String(tf || '').trim();
    return TF_ALIAS[s] || s;
};

// Инициализация Socket.IO клиента с конфигурацией
const socket = io(config.SOCKET_URL, config.SOCKET_OPTIONS);
const FG_AGG_ENABLED = String(process.env.REACT_APP_FG_AGG_ENABLED || '') === '1';
const FG_DEBUG = typeof window !== 'undefined' && window.__FG_DEBUG === true;

const EMPTY_CHART_OWNERSHIP_STATE = Object.freeze({
    confirmedSelection: null,
    requestedSelection: null,
    hasValidSnapshot: false,
    requestKind: 'none',
    requestStatus: 'idle',
    dataStatus: 'not_ready',
    failureScope: 'none',
    failureMessage: null,
});

const createEmptyChartOwnershipState = () => ({
    ...EMPTY_CHART_OWNERSHIP_STATE,
});

const buildSelectionSnapshot = (ticker, timeframe, interval, selectedDate) => {
    const tickerKey = String(ticker || '').trim().toUpperCase();
    const timeframeKey = String(timeframe || '').trim();
    const intervalKey = String(interval || '').trim();
    const selectedDateKey = String(selectedDate || '').trim();

    if (!tickerKey || !timeframeKey || !intervalKey || !selectedDateKey) {
        return null;
    }

    return {
        ticker: tickerKey,
        timeframe: timeframeKey,
        interval: intervalKey,
        selectedDate: selectedDateKey,
        rangeKey: `${tickerKey}|${timeframeKey}`,
    };
};

const isSameSelection = (left, right) => {
    if (!left || !right) return false;
    return (
        left.ticker === right.ticker &&
        left.timeframe === right.timeframe &&
        left.interval === right.interval &&
        left.selectedDate === right.selectedDate
    );
};

const resolveRequestKind = (prevState, nextSelection) => {
    if (!nextSelection) return 'none';
    if (!prevState?.confirmedSelection) return 'initial_load';
    return isSameSelection(prevState.confirmedSelection, nextSelection)
        ? 'background_refresh'
        : 'selection_change';
};

const beginOwnershipRequest = (prevState, nextSelection) => {
    if (!nextSelection) return prevState;
    const requestKind = resolveRequestKind(prevState, nextSelection);
    return {
        ...prevState,
        requestedSelection: nextSelection,
        requestKind,
        requestStatus: 'pending',
        dataStatus: prevState.hasValidSnapshot ? 'stale_snapshot' : 'not_ready',
        failureScope: 'none',
        failureMessage: null,
    };
};

const promoteConfirmedSelection = (prevState, nextSelection, options = {}) => {
    if (!nextSelection) return prevState;
    const hasCandles = options.hasCandles === true;
    return {
        ...prevState,
        confirmedSelection: nextSelection,
        requestedSelection: nextSelection,
        hasValidSnapshot: hasCandles,
        requestKind: 'none',
        requestStatus: 'idle',
        dataStatus: hasCandles ? 'ready' : 'empty_confirmed',
        failureScope: 'none',
        failureMessage: null,
    };
};

const failOwnershipRequest = (prevState, message) => ({
    ...prevState,
    requestStatus: 'failed',
    dataStatus: prevState.hasValidSnapshot ? 'stale_snapshot' : 'not_ready',
    failureScope:
        prevState.requestKind && prevState.requestKind !== 'none'
            ? prevState.requestKind
            : 'initial_load',
    failureMessage: message || null,
});

function App() {
    const sourceAuthority = FG_AGG_ENABLED ? 'rest' : 'app';
    // Состояния для управления данными и UI
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState({ candles: [], error: null, rangeKey: '' });
    const [chartOwnershipState, setChartOwnershipState] = useState(createEmptyChartOwnershipState);
    const [news, setNews] = useState([]);
    const [dividends, setDividends] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Для общей загрузки данных
    const [isChartLoading, setIsChartLoading] = useState(false); // Для загрузки данных графика
    const [timeframe, setTimeframe] = useState('3mth'); // Дефолтный таймфрейм для графика: 3 месяца (выравниваем compact/expanded)
    const [selectedDate, setSelectedDate] = useState('2023-10-10'); // Выбранная дата для графика
    const [socketConnected, setSocketConnected] = useState(false); // Состояние подключения к сокету
    const [interval, setIntervalValue] = useState('1m'); // Интервал свечей для графика (например, 1 минута)
    const [isChartExpanded, setIsChartExpanded] = useState(false); // Состояние развернутого графика
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Видимость формы поиска в развернутом режиме
    const [isSearchActive, setIsSearchActive] = useState(false); // Активность поля поиска (для затемнения фона)
    // --- Unified search entry point (single source of truth: query) ---
    // Любая точка "поиска" (верхний SearchForm, Results/Chart/Expanded) делает одно и то же:
    // нормализовать строку и обновить query → дальше эффекты сами запускают fetchTickerInfo + emitChartDataRequest.
    const handleSearchQuery = useCallback((q) => {
        const next = String(q || '').trim().toUpperCase();
        if (!next) {
            if (FG_DEBUG) console.warn('[FG][App][onSearch] empty query ignored');
            return;
        }
        if (FG_DEBUG) console.warn('[FG][App][onSearch]', { next });
        setQuery(next);
    }, []);
    
    if (FG_DEBUG) {
        // eslint-disable-next-line no-console
        console.log('[FG][App][render]', { isChartExpanded, hasData: !!data, isLoading, query });
    }

    useEffect(() => {
        const candles = Array.isArray(chartData?.candles) ? chartData.candles : [];
        const firstTime = candles.length ? candles[0]?.time : null;
        const lastTime = candles.length ? candles[candles.length - 1]?.time : null;
        const requestId = window.__FG_REQUEST_ID__ || null;
        if (FG_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[TIMELINE:2/3] App.setChartData', {
                rangeKey: chartData?.rangeKey || '',
                candlesLen: candles.length,
                firstTime,
                lastTime,
                requestId,
                timestamp: requestId ? new Date(requestId).toISOString() : null,
            });
        }
    }, [chartData]);
    
    const tfGuard = useCallback((nextTf, nextInterval, expanded) => {
        const mode = expanded ? 'expanded' : 'compact';
        const { forced, allowed } = fixIntervalForTimeframe({
            timeframe: nextTf,
            requested: nextInterval,
            mode,
        });
        if (FG_DEBUG && forced !== nextInterval) {
            // eslint-disable-next-line no-console
            console.log('[FG][UX][TFGuard]', { tf: nextTf, requested: nextInterval, forced, mode, allowed });
        }
        return forced;
    }, []);

    const handleSelectInterval = useCallback((requestedInterval) => {
        const forced = tfGuard(timeframe, requestedInterval, isChartExpanded);
        setIntervalValue(forced);
    }, [tfGuard, timeframe, isChartExpanded]);

    const handleSelectTimeframe = useCallback((nextTimeframe) => {
        if (FG_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[FG][App][handleSelectTimeframe]', { nextTimeframe, current: timeframe, isExpanded: isChartExpanded });
        }
        setTimeframe(nextTimeframe);
        // При смене TF - валидируем текущий interval и форсим, если нужно
        const forced = tfGuard(nextTimeframe, interval, isChartExpanded);
        if (forced !== interval) setIntervalValue(forced);
    }, [tfGuard, interval, isChartExpanded]);
    
    const newsContainerRef = useRef(null);
    const chartDataCacheRef = useRef(new Map());
    const inflightRef = useRef(new Map());
    const pendingByRequestIdRef = useRef(new Map()); // requestId -> { key, rangeKey, silent }
    const lastRequestKeyRef = useRef('');
    const lastRangeKeyRef = useRef('');
    const isChartExpandedRef = useRef(false);
    const chartOwnershipStateRef = useRef(chartOwnershipState);

    useEffect(() => {
        isChartExpandedRef.current = isChartExpanded;
    }, [isChartExpanded]);

    useEffect(() => {
        chartOwnershipStateRef.current = chartOwnershipState;
    }, [chartOwnershipState]);

    const resetChartOwnershipState = useCallback(() => {
        setChartOwnershipState(createEmptyChartOwnershipState());
    }, []);

    const beginChartOwnershipRequest = useCallback((selection) => {
        if (!selection) return;
        setChartOwnershipState((prev) => beginOwnershipRequest(prev, selection));
    }, []);

    const commitChartOwnershipSelection = useCallback((selection, options = {}) => {
        if (!selection) return;
        setChartOwnershipState((prev) => promoteConfirmedSelection(prev, selection, options));
    }, []);

    const failChartOwnershipRequest = useCallback((message) => {
        setChartOwnershipState((prev) => failOwnershipRequest(prev, message));
    }, []);

    const getTtlMsForTimeframe = useCallback((tf) => {
        switch (String(tf || '').toLowerCase()) {
            case '1d': return 60 * 1000;
            case '5d': return 5 * 60 * 1000;
            case '1mth': return 15 * 60 * 1000;
            case '3mth': return 20 * 60 * 1000;
            case '6mth': return 30 * 60 * 1000;
            case '1y': return 60 * 60 * 1000;
            default: return 2 * 60 * 1000;
        }
    }, []);

    const buildChartKey = useCallback((ticker, tf, currentDate, currentInterval) => {
        const t = String(ticker || '').trim().toUpperCase() || 'NA';
        const timeframeKey = String(tf || '').trim() || 'NA';
        const d = String(currentDate || '').trim() || 'NA';
        const it = String(currentInterval || '').trim() || 'NA';
        return `${t}|${timeframeKey}|${it}|${d}`;
    }, []);
    const buildRangeKey = useCallback((ticker, tf) => {
        const t = String(ticker || '').trim().toUpperCase() || 'NA';
        const timeframeKey = String(tf || '').trim() || 'NA';
        return `${t}|${timeframeKey}`;
    }, []);

    // Функция для отправки запроса на данные графика через сокет
    const emitChartDataRequest = useCallback(
        (ticker, currenttimeframe, currentDate, currentInterval, opts = {}) => {
            const silent = opts?.silent === true;
            // Keep compact sparkline on the existing App/socket chartData path.
            // Expanded REST authority remains in ChartContainer/useCandles.
            if (FG_AGG_ENABLED && isChartExpanded) return;
            if (!String(currentDate || '').trim()) {
                if (FG_DEBUG) console.log('[FG][App][chartRequest] skip:missing-selectedDate', { ticker, currenttimeframe, currentInterval });
                return;
            }
            const key = buildChartKey(ticker, currenttimeframe, currentDate, currentInterval);
            const rangeKey = buildRangeKey(ticker, currenttimeframe);
            const selection = buildSelectionSnapshot(ticker, currenttimeframe, currentInterval, currentDate);
            const now = Date.now();
            const cached = chartDataCacheRef.current.get(key);
            const inflight = inflightRef.current.get(key);
            const hasCache = Boolean(cached?.candles?.length);

            if (hasCache && cached.expiresAt > now) {
                if (FG_DEBUG) console.log('[FG][App][cache] hit:fresh', { key, len: cached.candles.length });
                if (!silent) {
                    setChartData({ candles: cached.candles, error: null, rangeKey: cached.rangeKey || rangeKey });
                    setIsChartLoading(false);
                    commitChartOwnershipSelection(selection, {
                        hasCandles: Array.isArray(cached.candles) && cached.candles.length > 0,
                    });
                }
                return;
            }

            if (!silent) {
                beginChartOwnershipRequest(selection);
            }

            if (!silent && hasCache) {
                if (FG_DEBUG) console.log('[FG][App][cache] hit:stale', { key, len: cached.candles.length });
                // Compact UX: don't push stale candles into chartData.
                // Otherwise CompactSparkline will draw the previous range under the new selection.
                // We keep previous chartData as-is and wait for fresh WS payload.
                setIsChartLoading(true);
            } else if (!silent) {
                if (FG_DEBUG) console.log('[FG][App][cache] miss', { key });
                setIsChartLoading(true);
            }

            if (inflight && now - inflight.ts < inflight.ttlMs) {
                // If silent prefetch is in flight and user requested real data — allow "upgrade"
                if (!silent && inflight.silent === true) {
                    inflightRef.current.set(key, { ...inflight, silent: false, ts: now });
                    if (FG_DEBUG) console.log('[FG][App][cache] inflight upgrade', { key });
                } else {
                    if (FG_DEBUG) console.log('[FG][App][cache] inflight skip', { key });
                    return;
                }
            }

            const ttlMs = getTtlMsForTimeframe(currenttimeframe);
            // store silent flag in inflight
            inflightRef.current.set(key, { ts: now, ttlMs, silent });
            if (!silent) {
                lastRequestKeyRef.current = key;
                lastRangeKeyRef.current = rangeKey;
            }
            if (FG_DEBUG) console.log('[FG][App][cache] emit', { key });
            const requestId = Date.now();
            pendingByRequestIdRef.current.set(requestId, { key, rangeKey, silent, selection });
            socket.emit('requestChartData', {
                ticker,
                timeframe: currenttimeframe,
                selectedDate: currentDate,
                interval: currentInterval,
                requestId,
                silent,
            });
        },
        [
            beginChartOwnershipRequest,
            buildChartKey,
            buildRangeKey,
            commitChartOwnershipSelection,
            getTtlMsForTimeframe,
            isChartExpanded,
        ]
    );

    // Функция для получения ОСНОВНОЙ информации о тикере (без данных графика)
    const fetchTickerInfo = useCallback(async (searchQuery) => {
        setIsLoading(true); // Начинаем общую загрузку
        setData(null);
        setNews([]);
        setDividends([]);
        setChartData({ candles: [], error: null, rangeKey: '' }); // Сбрасываем старые данные графика
        resetChartOwnershipState();

        try {
            if (FG_DEBUG) {
                // eslint-disable-next-line no-console
                console.log('[FG][fetchTickerInfo][start]', { query: searchQuery });
            }
            const response = await fetch(`${config.API_BASE_URL}${config.ENDPOINTS.TICKER}/${searchQuery}`, {
                // FG: search is a user-triggered action; avoid browser 304/ETag cache artifacts
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                },
            });
            if (FG_DEBUG) {
                // eslint-disable-next-line no-console
                console.log('[FG][fetchTickerInfo][response]', { status: response.status, ok: response.ok });
            }
            if (!response.ok) {
                if (response.status === 404) {
                    setData({ error: 'Тикер не найден. Пожалуйста, проверьте правильность ввода.' });
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const result = await response.json();
                if (FG_DEBUG) {
                    // eslint-disable-next-line no-console
                    console.log('[FG][fetchTickerInfo][resultKeys]', {
                        keys: Object.keys(result || {}),
                        hasError: !!result?.error,
                    });
                }
                setData(result);
                setNews(result.news || []);
                setDividends(result.dividends || []);
                if (result?.date) {
                    setSelectedDate(result.date);
                }
                // Данные для графика будут запрошены в отдельном useEffect
            }
        } catch (error) {
            if (FG_DEBUG) {
                // eslint-disable-next-line no-console
                console.log('[FG][fetchTickerInfo][catch]', { message: error?.message });
            }
            console.error('Ошибка при получении информации о тикере:', error);
            setData({ error: 'Произошла ошибка при загрузке данных. Пожалуйста, попробуйте еще раз.' });
        } finally {
            setIsLoading(false); // Завершаем общую загрузку
        }
    }, [resetChartOwnershipState]); // Убираем все зависимости, эта функция должна быть стабильной

    // Эффект для вызова fetchTickerInfo ТОЛЬКО при изменении 'query'
    useEffect(() => {
        if (FG_DEBUG) console.log('[FG][App][queryEffect]', { query });
        if (query) {
            fetchTickerInfo(query);
        }
    }, [query, fetchTickerInfo]);

    useEffect(() => {
        if (isChartExpanded && !data && !isLoading) {
            setIsChartExpanded(false);
        }
    }, [isChartExpanded, data, isLoading]);

    // ✅ ГЛАВНОЕ ИЗМЕНЕНИЕ: Отдельный эффект для запроса данных графика
    useEffect(() => {
        if (FG_AGG_ENABLED && isChartExpanded) {
            if (FG_DEBUG) console.log('[FG][App][chartRequestEffect] skip:agg-expanded', { query, timeframe, selectedDate, interval });
            return;
        }
        // Запрашиваем данные, только если есть тикер (query) и сокет подключен
        if (query && socketConnected) {
            if (FG_DEBUG) console.log('Requesting chart data with params:', { query, timeframe, selectedDate, interval });
            const forcedInterval = tfGuard(timeframe, interval, isChartExpanded);
            if (forcedInterval !== interval) {
                setIntervalValue(forcedInterval);
                return;
            }
            const tfForSocket = normalizeTimeframeForSocket(timeframe);
            emitChartDataRequest(query, tfForSocket, selectedDate, interval);
            return;
        }
        if (FG_DEBUG) console.log('[FG][App][chartRequestEffect] skip', { query, socketConnected });
    }, [query, timeframe, interval, selectedDate, socketConnected, emitChartDataRequest]); // Зависимости от всех параметров графика

    // Эффект для управления подключениями и событиями Socket.IO
    useEffect(() => {
        const handleConnect = () => {
            if (FG_DEBUG) console.log('[SOCKET] Подключено к Socket.IO');
            setSocketConnected(true);
            // Catch-up: if query was set before socket connected, chartRequestEffect could have skipped.
            // Keep the compact bridge alive in REST mode, but never reopen Expanded ownership.
            try {
                if ((!FG_AGG_ENABLED || !isChartExpandedRef.current) && query) {
                    const tfForSocket = normalizeTimeframeForSocket(timeframe);
                    if (FG_DEBUG) console.log('[FG][App][connectEmit]', { query, timeframe, tfForSocket, selectedDate, interval });
                    emitChartDataRequest(query, tfForSocket, selectedDate, interval);
                }
            } catch (e) {
                if (FG_DEBUG) console.warn('[FG][App][connectEmit] failed', e);
            }
        };

        const handleDisconnect = () => {
            if (FG_DEBUG) console.log('[SOCKET] Отключено от Socket.IO');
            setSocketConnected(false);
        };

        const handleInitialData = (payload) => {
            if (FG_DEBUG) {
                console.log('[SOCKET] Received initialData:', payload);
                console.warn('[FG][SOCKET][initialData]', {
                    hasCandles: Array.isArray(payload?.candles),
                    len: Array.isArray(payload?.candles) ? payload.candles.length : null,
                    ticker: payload?.ticker || payload?.secid || null,
                });
            }
            const hasCandles = Array.isArray(payload?.candles);
            const nextCandlesLen = hasCandles ? payload.candles.length : null;
            const meta = payload?.requestId ? pendingByRequestIdRef.current.get(payload.requestId) : null;
            const key = meta?.key || lastRequestKeyRef.current;
            const rk = meta?.rangeKey || lastRangeKeyRef.current || '';
            const silent = meta?.silent === true;
            const selection =
                meta?.selection ||
                chartOwnershipStateRef.current.requestedSelection ||
                chartOwnershipStateRef.current.confirmedSelection;
            if (hasCandles) {
                if (FG_DEBUG) console.warn('[FG][App][setChartData][initialData][before]', { prevLen: null, nextLen: nextCandlesLen });
                if (!silent) {
                    setChartData({ candles: payload.candles, error: null, rangeKey: rk });
                    commitChartOwnershipSelection(selection, {
                        hasCandles: payload.candles.length > 0,
                    });
                }
                if (key) {
                    const inflight = inflightRef.current.get(key);
                    const ttlMs = inflight?.ttlMs || 0;
                    const now = Date.now();
                    chartDataCacheRef.current.set(key, {
                        candles: payload.candles,
                        rangeKey: rk,
                        ts: now,
                        expiresAt: ttlMs ? now + ttlMs : now,
                    });
                    inflightRef.current.delete(key);
                    if (FG_DEBUG) console.log('[FG][App][cache] store', { key, len: payload.candles.length, ttlMs });
                }
            } else {
                if (!silent) {
                    setChartData((prev) => {
                        if (FG_DEBUG) console.warn('[FG][App][setChartData][initialData][before]', {
                            prevLen: Array.isArray(prev?.candles) ? prev.candles.length : null,
                            nextLen: nextCandlesLen,
                        });
                        return { ...prev, candles: [], error: null, rangeKey: rk };
                    });
                    commitChartOwnershipSelection(selection, { hasCandles: false });
                }
                if (key) inflightRef.current.delete(key);
            }
            if (!silent) setIsChartLoading(false); // Завершаем загрузку графика
            if (payload?.requestId) pendingByRequestIdRef.current.delete(payload.requestId);
        };

        const handleUpdateData = (payload) => {
            if (FG_DEBUG) console.log('[SOCKET] Received updateData:', payload);
            const meta = payload?.requestId ? pendingByRequestIdRef.current.get(payload.requestId) : null;
            const key = meta?.key || lastRequestKeyRef.current;
            const rk = meta?.rangeKey || lastRangeKeyRef.current || '';
            const silent = meta?.silent === true;
            const selection = meta?.selection || null;
            if (payload && Array.isArray(payload.candles)) {
                if (!silent) {
                    setChartData(prevData => ({
                        ...prevData,
                        candles: payload.candles,
                        error: null,
                        rangeKey: rk,
                    }));
                    if (selection) {
                        commitChartOwnershipSelection(selection, {
                            hasCandles: payload.candles.length > 0,
                        });
                    }
                }
                if (key) {
                    const cached = chartDataCacheRef.current.get(key);
                    if (cached) {
                        chartDataCacheRef.current.set(key, {
                            ...cached,
                            candles: payload.candles,
                            rangeKey: rk || cached.rangeKey || '',
                            ts: Date.now(),
                        });
                        if (FG_DEBUG) console.log('[FG][App][cache] update', { key, len: payload.candles.length });
                    }
                }
            }
        };

        const handleError = (error) => {
            console.log('[SOCKET] Received error:', error);
            const nextMessage = error.message || 'Ошибка загрузки данных графика.';
            const hasValidSnapshot = Boolean(chartOwnershipStateRef.current?.hasValidSnapshot);
            setChartData((prev) => (
                hasValidSnapshot
                    ? { ...prev, error: nextMessage }
                    : { candles: [], error: nextMessage, rangeKey: '' }
            ));
            failChartOwnershipRequest(nextMessage);
            setIsChartLoading(false); // Завершаем загрузку графика
            const key = lastRequestKeyRef.current;
            if (key) {
                inflightRef.current.delete(key);
                console.log('[FG][App][cache] error', { key });
            }
            pendingByRequestIdRef.current.clear();
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // IMPORTANT: connect could have happened before handlers were attached
        // (hot reload / fast refresh / cached socket).
        if (socket.connected) {
            if (FG_DEBUG) console.log('[SOCKET] already connected → sync');
            handleConnect();
        }
        socket.on('initialData', handleInitialData);
        socket.on('updateData', handleUpdateData);
        socket.on('error', handleError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('initialData', handleInitialData);
            socket.off('updateData', handleUpdateData);
            socket.off('error', handleError);
        };
    }, [commitChartOwnershipSelection, failChartOwnershipRequest]); // Этот useEffect настраивает слушатели один раз

    // Prefetch heavy compact ranges so 6m/1y feel instant on click
    useEffect(() => {
        if (!query || !socketConnected || !selectedDate) return;
        // only prefetch in compact UX (expanded has its own heavy chart)
        if (isChartExpanded) return;
        const tf6 = '6mth';
        const tfY = '1y';
        const tfFor6 = normalizeTimeframeForSocket(tf6);
        const tfForY = normalizeTimeframeForSocket(tfY);
        // interval already guarded elsewhere; use current interval to keep backend consistent
        emitChartDataRequest(query, tfFor6, selectedDate, interval, { silent: true });
        emitChartDataRequest(query, tfForY, selectedDate, interval, { silent: true });
    }, [query, socketConnected, selectedDate, interval, isChartExpanded, emitChartDataRequest]);

    const handleRestOwnershipSignal = useCallback((event) => {
        const phase = String(event?.phase || '').trim();
        if (!phase) return;

        if (phase === 'reset') {
            resetChartOwnershipState();
            return;
        }

        const selection = buildSelectionSnapshot(
            event?.selection?.ticker,
            event?.selection?.timeframe,
            event?.selection?.interval,
            event?.selection?.selectedDate
        );

        if (!selection) return;

        if (phase === 'pending') {
            beginChartOwnershipRequest(selection);
            return;
        }

        if (phase === 'commit') {
            commitChartOwnershipSelection(selection, {
                hasCandles: event?.hasCandles === true,
            });
            return;
        }

        if (phase === 'failure') {
            setChartOwnershipState((prev) => {
                const nextState = isSameSelection(prev.requestedSelection, selection)
                    ? prev
                    : beginOwnershipRequest(prev, selection);
                return failOwnershipRequest(nextState, event?.error || null);
            });
        }
    }, [
        beginChartOwnershipRequest,
        commitChartOwnershipSelection,
        resetChartOwnershipState,
    ]);

    return (
        <div className="App">
            <Header />

            {!isChartExpanded && (
                <>
                    <SearchForm 
                        onSearch={handleSearchQuery}                   onClear={() => {
                            setQuery('');
                            setData(null);
                            setChartData({ candles: [], error: null, rangeKey: '' });
                            resetChartOwnershipState();
                            setNews([]);
                            setDividends([]);
                            setSelectedDate('');
                        }}
                        isSubmitted={!!data}
                    />
                </>
            )}

            {isLoading && !isChartExpanded ? (
                <LoadingSkeleton />
            ) : (
                <>
                <Results
                    sourceAuthority={sourceAuthority}
                    query={query}
                    data={data}
                    socket={socket}
                    chartData={chartData}
                    news={news}
                    dividends={dividends}
                    newsContainerRef={newsContainerRef}
                    toggleNews={() => {}}
                    currentTimeframe={timeframe}
                    onSelectTimeframe={handleSelectTimeframe}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    isLoading={isLoading}
                    isChartLoading={isChartLoading}
                    currentInterval={interval}
                    onSelectInterval={handleSelectInterval}
                    isChartExpanded={isChartExpanded}
                    onRestOwnershipSignal={handleRestOwnershipSignal}
                    isSearchVisible={isSearchVisible}
                    onToggleExpand={(expanded) => {
                        setIsChartExpanded(expanded);
                        if (!expanded) setIsSearchVisible(false);
                    }}
                    onToggleSearch={() => {
                        setIsSearchVisible(true);
                    }}
                    onSearch={handleSearchQuery}  />
                </>
            )}

            {chartData.error ? (
                <div className="error-message">
                    <p>{chartData.error}</p>
                </div>
            ) : null}

            {/* *удалим позже* */}
<AiTestButton /> 

<AiStreamButton />

            <SearchModal
                isOpen={isSearchVisible}
                onClose={() => setIsSearchVisible(false)}
                onSearch={handleSearchQuery}/>
        </div>
    );
}

export default App;
