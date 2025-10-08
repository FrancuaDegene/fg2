import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useSearch from '../../hooks/useSearch';
import './SearchModal.css';
import Overlay from '../Overlay/Overlay';

const SearchModal = ({ isOpen, onClose, onSearch }) => {
    const searchInputRef = useRef(null);
    
    const {
        query,
        suggestions,
        isLoading,
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

    // Обработка клавиш
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
            
            // Фокус на поле ввода при открытии
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
            {/* Заголовок модального окна */}
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

            {/* Поле поиска */}
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

                {/* Индикатор загрузки */}
                {isLoading && (
                    <div className="search-loading">
                        Поиск...
                    </div>
                )}

                {/* Список подсказок */}
                {!isLoading && suggestions.length > 0 && (
                    <div className="search-suggestions">
                        {suggestions.map((item) => (
                            <div
                                key={item.ticker}
                                className="search-suggestion-item"
                                onClick={() => handleSuggestionClick(item.ticker)}
                            >
                                <div className="suggestion-ticker">{item.ticker}</div>
                                <div className="suggestion-name">{item.company_name}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Сообщение когда нет результатов */}
                {!isLoading && query.length > 2 && suggestions.length === 0 && (
                    <div className="search-no-results">
                        Ничего не найдено для "{query}"
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