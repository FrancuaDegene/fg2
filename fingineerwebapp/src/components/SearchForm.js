import React, { useState, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import config from '../config/api';
import "./SearchForm.css";

// Guard для подсказок: убираем мусорные символы, не шлём пустое/слишком короткое
const sanitizeSuggestionsQuery = (value) => {
    let q = String(value ?? '').trim();
    if (!q) return '';
    q = q.replace(/=+$/g, '').trim();
    q = q.replace(/[^a-zA-Z0-9._-]+/g, '');
    return q;
};

const SearchForm = ({ 
    onSearch, 
    onClear = () => {}, 
    isSubmitted = false,
    onFocus = () => {},
    onBlur = () => {},
    isChartExpanded = false,
    isSearchFormHidden = false
}) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const getEffectiveQuery = (raw) =>
        String(raw ?? inputRef.current?.value ?? query ?? '').trim();

    const debouncedFetch = useMemo(
        () =>
            debounce(async (value) => {
                const qSafe = sanitizeSuggestionsQuery(value);
                if (qSafe.length < 2) {
                    setSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(`${config.SUGGESTIONS_API_URL}${config.ENDPOINTS.SUGGESTIONS}/${encodeURIComponent(qSafe)}`);
                    setSuggestions(response.data.slice(0, 5));
                } catch (error) {
                    setSuggestions([]);
                }
            }, 300),
        []
    );

    const handleSearch = (raw) => {
        const q = getEffectiveQuery(raw);
        if (!q) return;
        setSuggestions([]);
        onSearch(q);
        setIsActive(false);
        onBlur();
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
        onClear();
    };

    const handleSuggestionClick = (ticker) => {
        setQuery(ticker);
        setSuggestions([]);
        handleSearch(ticker);
    };

    if (isChartExpanded && isSearchFormHidden) {
        return null;
    }

    const searchContainerClass = `search-container ${isActive ? "active" : ""} ${isSubmitted ? "submitted" : ""}`;

    return (
        <>
            {/* Оверлей только в обычном режиме */}
            {isActive && !isChartExpanded && (
                <div 
                    className="search-overlay"
                />
            )}
            
            <div
                ref={searchRef}
                className={searchContainerClass}
            >
                <div className="form-group">
                    <div className="input-group">
                        <input
                            type="text"
                            className="search-bar"
                            value={query}
                            ref={inputRef}
                            onMouseDown={() => {
                                setIsActive(true);
                            }}
                            onFocus={() => {
                                onFocus();
                            }}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                debouncedFetch(e.target.value);
                            }}
                            onBlur={() => onBlur()}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch(e.currentTarget.value);
                                }
                            }}
                            placeholder="Введите название компании или тикера"
                            autoFocus={isChartExpanded}
                        />
                        {query && (
                            <div className="buttons-wrapper">
                                <button 
                                    className="clear-btn" 
                                    onClick={handleClear}
                                    aria-label="Очистить поиск"
                                >
                                    ✖
                                </button>
                                <button 
                                    className="search-btn"
                                    onClick={() => {
                                        handleSearch();
                                    }}
                                    aria-label="Выполнить поиск"
                                >
                                    Поиск
                                </button>
                            </div>
                        )}
                    </div>

                    {isActive && suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((item) => (
                                <li
                                    key={item.ticker}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(item.ticker)}
                                >
                                    {item.ticker} - {item.company_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

SearchForm.propTypes = {
    onSearch: PropTypes.func.isRequired,
    onClear: PropTypes.func,
    isSubmitted: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    isChartExpanded: PropTypes.bool,
    isSearchFormHidden: PropTypes.bool
};

export default SearchForm;
