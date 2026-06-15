import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import config from '../config/api';
import { UI_CONFIG } from '../constants';

// Хук для переиспользования логики поиска
const useSearch = ({ onSearch, onClear = () => {} }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Debounced функция для получения подсказок
    const debouncedFetch = useMemo(
        () =>
            debounce(async (value) => {
                const raw = String(value ?? '');
                let q = raw.trim();
                // Guard: не шлём мусорные запросы вида "sb=" или пустые строки
                if (!q) {
                    setSuggestions([]);
                    setIsLoading(false);
                    setError('');
                    return;
                }
                q = q.replace(/=+$/g, '').trim();
                if (q.length < 2) {
                    setSuggestions([]);
                    setIsLoading(false);
                    setError('');
                    return;
                }

                setError('');
                setSuggestions([]);
                setIsLoading(true);
                try {
                    const response = await axios.get(
                        `${config.SUGGESTIONS_API_URL}${config.ENDPOINTS.SUGGESTIONS}/${encodeURIComponent(q)}`
                    );
                    setSuggestions((response.data || []).slice(0, UI_CONFIG.MAX_SUGGESTIONS));
                    setError('');
                } catch (error) {
                    console.error('Ошибка получения подсказок:', error);
                    setSuggestions([]);
                    setError('Не удалось загрузить подсказки. Попробуйте ещё раз.');
                } finally {
                    setIsLoading(false);
                }
            }, 300),
        []
    );

    // Обработчик изменения запроса
    const handleQueryChange = (value) => {
        setQuery(value);
        setError('');
        debouncedFetch(value);
    };

    // Обработчик поиска
    const handleSearch = () => {
        if (query.trim()) {
            setError('');
            setSuggestions([]);
            onSearch(query);
        }
    };

    // Обработчик очистки
    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setError('');
        onClear();
    };

    // Обработчик клика по подсказке
    const handleSuggestionClick = (ticker) => {
        setQuery(ticker);
        setSuggestions([]);
        setError('');
        onSearch(ticker);
    };

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    return {
        query,
        suggestions,
        isLoading,
        error,
        handleQueryChange,
        handleSearch,
        handleClear,
        handleSuggestionClick,
    };
};

export default useSearch;
