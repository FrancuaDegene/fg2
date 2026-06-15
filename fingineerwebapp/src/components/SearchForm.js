import React, { useEffect, useRef, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import useSearch from '../hooks/useSearch';
import SearchSuggestionItem from './SearchSuggestionItem/SearchSuggestionItem';
import config from '../config/api';
import "./SearchForm.css";

const BROWSE_FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'share', label: 'Акции' },
    { id: 'fund', label: 'Фонды' },
    { id: 'index', label: 'Индексы' },
];

const BROWSE_FOOTER_LABELS = {
    all: 'Показать все инструменты',
    share: 'Показать все акции',
    fund: 'Показать все фонды',
    index: 'Показать все индексы',
};

const RECENT_SELECTIONS_KEY = 'fg.searchForm.recentSelections.v1';
const MAX_RECENT_SELECTIONS = 5;

const getLocalStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage || null;
};

const normalizeRecentSelection = (item) => {
    const ticker = String(item?.ticker || '').trim().toUpperCase();

    if (!ticker) {
        return null;
    }

    return {
        ticker,
        displayName: item?.displayName || '',
        company_name: item?.company_name || '',
        instrumentType: item?.instrumentType || '',
        shareClass: item?.shareClass || '',
        exchange: item?.exchange || '',
        currency: item?.currency || '',
    };
};

const readRecentSelections = () => {
    try {
        const storage = getLocalStorage();
        const storedValue = storage?.getItem(RECENT_SELECTIONS_KEY);
        const parsedValue = storedValue ? JSON.parse(storedValue) : [];

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue
            .map(normalizeRecentSelection)
            .filter(Boolean)
            .slice(0, MAX_RECENT_SELECTIONS);
    } catch {
        return [];
    }
};

const writeRecentSelections = (items) => {
    try {
        const storage = getLocalStorage();

        if (!storage) {
            return;
        }

        storage.setItem(RECENT_SELECTIONS_KEY, JSON.stringify(items));
    } catch {
    }
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
    const [isActive, setIsActive] = useState(false);
    const [browseType, setBrowseType] = useState('all');
    const [browseItems, setBrowseItems] = useState([]);
    const [isBrowseLoading, setIsBrowseLoading] = useState(false);
    const [browseUnavailable, setBrowseUnavailable] = useState(false);
    const [browseRetryKey, setBrowseRetryKey] = useState(0);
    const [recentSelections, setRecentSelections] = useState(readRecentSelections);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    const {
        query,
        suggestions,
        isLoading,
        error,
        handleQueryChange,
        handleClear: clearSearch,
        handleSuggestionClick: selectSuggestion,
    } = useSearch({ onSearch, onClear });

    const trimmedQuery = query.trim();
    const showBrowseMode = isActive && trimmedQuery.length === 0;

    useEffect(() => {
        if (!showBrowseMode) {
            return undefined;
        }

        const controller = new AbortController();

        const fetchBrowseItems = async () => {
            setIsBrowseLoading(true);
            setBrowseUnavailable(false);

            try {
                const response = await axios.get(
                    `${config.INSTRUMENTS_API_URL}${config.ENDPOINTS.INSTRUMENTS_BROWSE}`,
                    {
                        params: {
                            type: browseType,
                            limit: 20,
                        },
                        signal: controller.signal,
                    }
                );
                setBrowseItems(Array.isArray(response.data?.items) ? response.data.items : []);
            } catch (error) {
                if (axios.isCancel?.(error) || error.name === 'CanceledError') {
                    return;
                }
                console.error('Ошибка загрузки каталога инструментов:', error);
                setBrowseItems([]);
                setBrowseUnavailable(true);
            } finally {
                if (!controller.signal.aborted) {
                    setIsBrowseLoading(false);
                }
            }
        };

        fetchBrowseItems();

        return () => {
            controller.abort();
        };
    }, [browseType, browseRetryKey, showBrowseMode]);

    useEffect(() => {
        if (!isActive) {
            return undefined;
        }

        const closePicker = () => {
            setIsActive(false);
            onBlur();
        };

        const handlePointerDown = (event) => {
            if (searchRef.current?.contains(event.target)) {
                return;
            }
            closePicker();
        };

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') {
                return;
            }
            event.preventDefault();
            closePicker();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, onBlur]);

    const handleSearch = () => {
        if (!trimmedQuery) return;

        const exactTickerMatch = suggestions.find((suggestion) => (
            String(suggestion?.ticker || '').trim().toUpperCase() === trimmedQuery.toUpperCase()
        ));

        if (!exactTickerMatch) {
            setIsActive(true);
            return;
        }

        handleConfirmedSelection(exactTickerMatch);
    };

    const handleClear = () => {
        clearSearch();
    };

    const saveRecentSelection = (item) => {
        const recentItem = normalizeRecentSelection(item);

        if (!recentItem) {
            return;
        }

        setRecentSelections((currentItems) => {
            const nextItems = [
                recentItem,
                ...currentItems.filter((currentItem) => (
                    String(currentItem?.ticker || '').trim().toUpperCase() !== recentItem.ticker
                )),
            ].slice(0, MAX_RECENT_SELECTIONS);

            writeRecentSelections(nextItems);

            return nextItems;
        });
    };

    const clearRecentSelections = () => {
        setRecentSelections([]);

        try {
            getLocalStorage()?.removeItem(RECENT_SELECTIONS_KEY);
        } catch {
        }
    };

    const handleConfirmedSelection = (item) => {
        const ticker = String(item?.ticker || '').trim().toUpperCase();

        if (!ticker) {
            return;
        }

        saveRecentSelection(item);
        selectSuggestion(ticker);
        setIsActive(false);
        onBlur();
    };

    const handleBrowseRetry = () => {
        setBrowseRetryKey((key) => key + 1);
    };

    const handleTypedRetry = () => {
        handleQueryChange(query);
    };

    if (isChartExpanded && isSearchFormHidden) {
        return null;
    }

    const searchContainerClass = `search-container ${isActive ? "active" : ""} ${isSubmitted ? "submitted" : ""}`;
    const hasMeaningfulQuery = trimmedQuery.length >= 2;
    const showSuggestions = isActive && trimmedQuery.length > 0 && suggestions.length > 0;
    const showSuggestionState = isActive && hasMeaningfulQuery && suggestions.length === 0;
    const renderSuggestionSkeleton = (rowCount = 4) => (
        <div className="suggestion-skeleton" aria-hidden="true">
            {Array.from({ length: rowCount }).map((_, index) => (
                <div key={index} className="suggestion-skeleton-row">
                    <div className="suggestion-skeleton-icon" />
                    <div className="suggestion-skeleton-body">
                        <div className="suggestion-skeleton-line suggestion-skeleton-line--title" />
                        <div className="suggestion-skeleton-line suggestion-skeleton-line--meta" />
                    </div>
                    <div className="suggestion-skeleton-badge" />
                </div>
            ))}
        </div>
    );
    const renderSuggestionErrorState = (onRetry) => (
        <div className="suggestion-error-state" role="status">
            <span className="suggestion-error-icon" aria-hidden="true">!</span>
            <div className="suggestion-error-title">Не удалось загрузить данные</div>
            <div className="suggestion-error-description">
                Проверьте подключение и попробуйте ещё раз
            </div>
            {onRetry && (
                <button
                    type="button"
                    className="suggestion-error-action"
                    onClick={onRetry}
                >
                    Повторить
                </button>
            )}
        </div>
    );

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
                                setIsActive(true);
                                onFocus();
                            }}
                            onChange={(e) => {
                                handleQueryChange(e.target.value);
                            }}
                            onBlur={() => onBlur()}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch();
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
                                    aria-label="Показать данные по выбранному инструменту"
                                >
                                    Показать
                                </button>
                            </div>
                        )}
                    </div>

                    {showBrowseMode && (
                        <div className="search-picker-panel">
                            <div className="search-picker-filter-rail">
                                {BROWSE_FILTERS.map((filter) => (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        className={`search-picker-filter-chip ${browseType === filter.id ? 'active' : ''}`}
                                        onClick={() => setBrowseType(filter.id)}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            {recentSelections.length > 0 && (
                                <div className="search-picker-recent-section">
                                    <div className="search-picker-recent-header">
                                        <span className="search-picker-recent-title">Недавние запросы</span>
                                        <button
                                            type="button"
                                            className="search-picker-recent-clear"
                                            onClick={clearRecentSelections}
                                        >
                                            Очистить
                                        </button>
                                    </div>
                                    <ul className="search-picker-recent-list">
                                        {recentSelections.map((item) => (
                                            <SearchSuggestionItem
                                                as="li"
                                                key={item.ticker}
                                                item={item}
                                                className="suggestion-item"
                                                onSelect={() => handleConfirmedSelection(item)}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="search-picker-results">
                                {isBrowseLoading && (
                                    renderSuggestionSkeleton(4)
                                )}
                                {!isBrowseLoading && browseUnavailable && (
                                    renderSuggestionErrorState(handleBrowseRetry)
                                )}
                                {!isBrowseLoading && !browseUnavailable && browseItems.length === 0 && (
                                    <div className="suggestion-state-message">
                                        Инструменты не найдены
                                    </div>
                                )}
                                {!isBrowseLoading && !browseUnavailable && browseItems.length > 0 && (
                                    <ul className="suggestions-list">
                                        {browseItems.map((item) => (
                                            <SearchSuggestionItem
                                                as="li"
                                                key={item.ticker}
                                                item={item}
                                                className="suggestion-item"
                                                onSelect={() => handleConfirmedSelection(item)}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="search-picker-footer suggestions-footer" aria-hidden="true">
                                <span>{BROWSE_FOOTER_LABELS[browseType]}</span>
                            </div>
                        </div>
                    )}

                    {showSuggestions && (
                        <div className="search-picker-panel">
                            <div className="search-picker-filter-rail" aria-hidden="true" />
                            <div className="search-picker-results">
                                <ul className="suggestions-list">
                                {suggestions.map((item) => (
                                    <SearchSuggestionItem
                                        as="li"
                                        key={item.ticker}
                                        item={item}
                                        className="suggestion-item"
                                        onSelect={() => handleConfirmedSelection(item)}
                                    />
                                ))}
                                </ul>
                            </div>
                            {hasMeaningfulQuery && (
                                <div className="search-picker-footer suggestions-footer" aria-hidden="true">
                                    <span>Показать все результаты для "{query.trim()}"</span>
                                </div>
                            )}
                        </div>
                    )}

                    {showSuggestionState && (
                        <div className="search-picker-panel">
                            <div className="search-picker-filter-rail" aria-hidden="true" />
                            <div className="search-picker-results suggestion-state-list">
                            {isLoading && (
                                renderSuggestionSkeleton(3)
                            )}
                            {!isLoading && error && (
                                renderSuggestionErrorState(handleTypedRetry)
                            )}
                            {!isLoading && !error && (
                                <div className="suggestion-no-results">
                                    <span className="suggestion-no-results-icon" aria-hidden="true" />
                                    <div className="suggestion-no-results-title">Ничего не найдено</div>
                                    <div className="suggestion-no-results-description">
                                        Проверьте написание или попробуйте другой запрос
                                    </div>
                                    <div className="suggestion-no-results-hints" aria-label="Попробуйте">
                                        <div>Попробуйте:</div>
                                        <ul>
                                            <li className="suggestion-no-results-hint">другой тикер</li>
                                            <li className="suggestion-no-results-hint">название компании</li>
                                            <li className="suggestion-no-results-hint">частичный запрос</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
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
