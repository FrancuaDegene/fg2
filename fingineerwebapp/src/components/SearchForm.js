import React, { useState, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import config from '../config/api';
import "./SearchForm.css";

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

    const debouncedFetch = useMemo(
        () =>
            debounce(async (value) => {
                if (value.trim()) {
                    try {
                        const response = await axios.get(`${config.SUGGESTIONS_API_URL}${config.ENDPOINTS.SUGGESTIONS}/${value}`);
                        setSuggestions(response.data.slice(0, 5));
                    } catch (error) {
                        setSuggestions([]);
                    }
                } else {
                    setSuggestions([]);
                }
            }, 300),
        []
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsActive(false);
                setSuggestions([]);
                onBlur();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsActive(false);
                setSuggestions([]);
                onBlur();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onBlur]);

    const handleSearch = () => {
        if (query.trim()) {
            setSuggestions([]);
            onSearch(query);
            setIsActive(false);
            onBlur();
        }
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
        onClear();
    };

    const handleSuggestionClick = (ticker) => {
        setQuery(ticker);
        setSuggestions([]);
        onSearch(ticker);
        setIsActive(false);
        onBlur();
    };

    if (isChartExpanded && isSearchFormHidden) {
        return null;
    }


    const searchContainerClass = `search-container ${isActive ? "active" : ""} ${isSubmitted ? "submitted" : ""}`;

    return (
        <>
            {/* Оверлей только в обычном режиме */}
            {isActive && !isChartExpanded && <div className="search-overlay" />}
            
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
                            onChange={(e) => {
                                setQuery(e.target.value);
                                debouncedFetch(e.target.value);
                            }}
                            onFocus={() => {
                                setIsActive(true);
                                onFocus();
                            }}
                            onBlur={() => onBlur()}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                                    onClick={handleSearch}
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