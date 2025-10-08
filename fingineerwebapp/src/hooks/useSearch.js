import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import config from '../config/api';

// Хук для переиспользования логики поиска
const useSearch = ({ onSearch, onClear = () => {} }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced функция для получения подсказок
    const debouncedFetch = useMemo(
        () =>
            debounce(async (value) => {
                if (value.trim()) {
                    setIsLoading(true);
                    try {
                        const response = await axios.get(
                            `${config.SUGGESTIONS_API_URL}${config.ENDPOINTS.SUGGESTIONS}/${value}`
                        );
                        setSuggestions(response.data.slice(0, 5));
                    } catch (error) {
                        console.error('Ошибка получения подсказок:', error);
                        setSuggestions([]);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setSuggestions([]);
                    setIsLoading(false);
                }
            }, 300),
        []
    );

    // Обработчик изменения запроса
    const handleQueryChange = (value) => {
        setQuery(value);
        debouncedFetch(value);
    };

    // Обработчик поиска
    const handleSearch = () => {
        if (query.trim()) {
            setSuggestions([]);
            onSearch(query);
        }
    };

    // Обработчик очистки
    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        onClear();
    };

    // Обработчик клика по подсказке
    const handleSuggestionClick = (ticker) => {
        setQuery(ticker);
        setSuggestions([]);
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
        handleQueryChange,
        handleSearch,
        handleClear,
        handleSuggestionClick,
    };
};

export default useSearch;