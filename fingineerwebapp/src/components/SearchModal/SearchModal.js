import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useSearch from '../../hooks/useSearch';
import './SearchModal.css';
import Overlay from '../Overlay/Overlay';
import SearchSuggestionItem from '../SearchSuggestionItem/SearchSuggestionItem';

const SearchModal = ({ isOpen, onClose, onSearch }) => {
    const searchInputRef = useRef(null);

    const {
        query,
        suggestions,
        isLoading,
        error,
        handleQueryChange,
        handleSearch,
        handleClear,
        handleSuggestionClick,
    } = useSearch({
        onSearch: (searchQuery) => {
            onSearch(searchQuery);
            onClose();
        },
        onClear: () => {}
    });

    const trimmedQuery = query.trim();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && query.trim()) {
                handleSearch();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 100);
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose, query, handleSearch]);

    if (!isOpen) return null;

    return (
        <Overlay
            isOpen={isOpen}
            variant="modal"
            onBackdropClick={onClose}
        >
            <div className="search-modal-header">
                <h3 className="search-modal-title">Поиск инструмента</h3>
                <button
                    className="search-modal-close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    ✕
                </button>
            </div>

            <div className="search-modal-body">
                <div className="search-input-container">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="search-modal-input"
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Введите название компании или тикера..."
                        autoComplete="off"
                    />

                    {query && (
                        <div className="search-input-actions">
                            <button
                                className="search-clear-btn"
                                onClick={handleClear}
                                aria-label="Очистить"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="search-loading">
                        Ищем инструменты…
                    </div>
                )}

                {!isLoading && error && (
                    <div className="search-error">
                        {error}
                    </div>
                )}

                {!isLoading && suggestions.length > 0 && (
                    <div className="search-results-panel">
                        <div className="search-suggestions">
                            {suggestions.map((item) => (
                                <SearchSuggestionItem
                                    key={item.ticker}
                                    item={item}
                                    className="search-suggestion-item"
                                    onSelect={handleSuggestionClick}
                                />
                            ))}
                        </div>
                        {trimmedQuery.length >= 2 && (
                            <div className="search-suggestions-footer" aria-hidden="true">
                                <span>Показать все результаты для "{trimmedQuery}"</span>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && !error && query.length > 2 && suggestions.length === 0 && (
                    <div className="search-no-results">
                        Ничего не найдено
                    </div>
                )}
            </div>
        </Overlay>
    );
};

SearchModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
};

export default SearchModal;
