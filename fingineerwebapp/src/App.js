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

// Инициализация Socket.IO клиента с конфигурацией
const socket = io(config.SOCKET_URL, config.SOCKET_OPTIONS);

function App() {
    // Состояния для управления данными и UI
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState({ candles: [], error: null });
    const [news, setNews] = useState([]);
    const [dividends, setDividends] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Для общей загрузки данных
    const [isChartLoading, setIsChartLoading] = useState(false); // Для загрузки данных графика
    const [timeframe, setTimeframe] = useState('1d'); // Временной интервал для графика (например, 1 день)
    const [selectedDate, setSelectedDate] = useState('2023-10-10'); // Выбранная дата для графика
    const [socketConnected, setSocketConnected] = useState(false); // Состояние подключения к сокету
    const [interval, setIntervalValue] = useState('1m'); // Интервал свечей для графика (например, 1 минута)
    const [isChartExpanded, setIsChartExpanded] = useState(false); // Состояние развернутого графика
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Видимость формы поиска в развернутом режиме
    const [isSearchActive, setIsSearchActive] = useState(false); // Активность поля поиска (для затемнения фона)
    
    const newsContainerRef = useRef(null);

    // Функция для отправки запроса на данные графика через сокет
    const emitChartDataRequest = useCallback(
        (ticker, currenttimeframe, currentDate, currentInterval) => {
            socket.emit('requestChartData', {
                ticker,
                timeframe: currenttimeframe,
                selectedDate: currentDate,
                interval: currentInterval,
            });
        },
        [] // Нет зависимостей, функция стабильна
    );

    // Функция для получения ОСНОВНОЙ информации о тикере (без данных графика)
    const fetchTickerInfo = useCallback(async (searchQuery) => {
        setIsLoading(true); // Начинаем общую загрузку
        setData(null);
        setNews([]);
        setDividends([]);
        setChartData({ candles: [], error: null }); // Сбрасываем старые данные графика

        try {
            const response = await fetch(`${config.API_BASE_URL}${config.ENDPOINTS.TICKER}/${searchQuery}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setData({ error: 'Тикер не найден. Пожалуйста, проверьте правильность ввода.' });
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const result = await response.json();
                setData(result);
                setNews(result.news || []);
                setDividends(result.dividends || []);
                // Данные для графика будут запрошены в отдельном useEffect
            }
        } catch (error) {
            console.error('Ошибка при получении информации о тикере:', error);
            setData({ error: 'Произошла ошибка при загрузке данных. Пожалуйста, попробуйте еще раз.' });
        } finally {
            setIsLoading(false); // Завершаем общую загрузку
        }
    }, []); // Убираем все зависимости, эта функция должна быть стабильной

    // Эффект для вызова fetchTickerInfo ТОЛЬКО при изменении 'query'
    useEffect(() => {
        if (query) {
            fetchTickerInfo(query);
        }
    }, [query, fetchTickerInfo]);

    // ✅ ГЛАВНОЕ ИЗМЕНЕНИЕ: Отдельный эффект для запроса данных графика
    useEffect(() => {
        // Запрашиваем данные, только если есть тикер (query) и сокет подключен
        if (query && socketConnected) {
            console.log('Requesting chart data with params:', { query, timeframe, selectedDate, interval });
            
            setIsChartLoading(true); // Показываем лоадер именно для графика
            
            emitChartDataRequest(query, timeframe, selectedDate, interval);
        }
    }, [query, timeframe, interval, selectedDate, socketConnected, emitChartDataRequest]); // Зависимости от всех параметров графика

    // Эффект для управления подключениями и событиями Socket.IO
    useEffect(() => {
        const handleConnect = () => {
            console.log('[SOCKET] Подключено к Socket.IO');
            setSocketConnected(true);
        };

        const handleDisconnect = () => {
            console.log('[SOCKET] Отключено от Socket.IO');
            setSocketConnected(false);
        };

        const handleInitialData = (payload) => {
            console.log('[SOCKET] Received initialData:', payload);
            if (payload && Array.isArray(payload.candles)) {
                setChartData({ candles: payload.candles, error: null });
            } else {
                setChartData(prev => ({ ...prev, candles: [], error: null }));
            }
            setIsChartLoading(false); // Завершаем загрузку графика
        };

        const handleUpdateData = (payload) => {
            console.log('[SOCKET] Received updateData:', payload);
            if (payload && Array.isArray(payload.candles)) {
                setChartData(prevData => ({
                    ...prevData,
                    candles: payload.candles
                }));
            }
        };

        const handleError = (error) => {
            console.log('[SOCKET] Received error:', error);
            setChartData({ candles: [], error: error.message || 'Ошибка загрузки данных графика.' });
            setIsChartLoading(false); // Завершаем загрузку графика
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
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
    }, []); // Этот useEffect настраивает слушатели один раз

    return (
        <div className="App">
            <Header />

            <Overlay
                isOpen={!isChartExpanded && isSearchActive}
                variant="backdrop"
            />

            {!isChartExpanded && (
                <SearchForm 
                    onSearch={setQuery} 
                    onClear={() => {
                        setQuery('');
                        setData(null);
                        setChartData({ candles: [], error: null });
                        setNews([]);
                        setDividends([]);
                    }}
                    isSubmitted={!!data}
                    onFocus={() => setIsSearchActive(true)}
                    onBlur={() => setIsSearchActive(false)}
                />
            )}

            {isLoading && !isChartExpanded ? (
                <LoadingSkeleton />
            ) : (
                <Results
                    data={data}
                    chartData={chartData}
                    news={news}
                    dividends={dividends}
                    newsContainerRef={newsContainerRef}
                    toggleNews={() => {}}
                    currentTimeframe={timeframe}
                    onSelectTimeframe={setTimeframe}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    isLoading={isLoading}
                    isChartLoading={isChartLoading}
                    currentInterval={interval}
                    onSelectInterval={setIntervalValue}
                    isChartExpanded={isChartExpanded}
                    isSearchVisible={isSearchVisible}
                    onToggleExpand={(expanded) => {
                        setIsChartExpanded(expanded);
                        if (!expanded) setIsSearchVisible(false);
                    }}
                    onToggleSearch={() => {
                        setIsSearchVisible(true);
                    }}
                    onSearch={setQuery}
                />
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
                onSearch={(q) => {
                    setQuery(q);
                    setIsSearchVisible(false);
                }}
            />
        </div>
    );
}

export default App;



