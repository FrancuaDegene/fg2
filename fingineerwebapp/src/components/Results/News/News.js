import React, { useState, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import './News.css';

const fallbackFormatDate = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return String(date);

  return parsedDate.toLocaleDateString('ru-RU');
};

const News = ({
  news = [],
  newsContainerRef,
  toggleNews,
  formatDate = fallbackFormatDate,
  isLoading = false,
}) => {
  const [visibleNewsCount, setVisibleNewsCount] = useState(10); // Показываем первые 10
  const [expandedNewsIndexes, setExpandedNewsIndexes] = useState(() => new Set());
  const loaderRef = useRef(null);
  const safeNews = Array.isArray(news) ? news : [];
  const safeFormatDate = typeof formatDate === 'function' ? formatDate : fallbackFormatDate;

  useEffect(() => {
    setExpandedNewsIndexes(new Set());
  }, [news]);

  // Обработчик скролла для подгрузки новостей
  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setVisibleNewsCount((prev) => Math.min(prev + 5, safeNews.length)); // Подгружаем по 5
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoaderRef) observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) observer.unobserve(currentLoaderRef);
    };
  }, [isLoading, safeNews.length]);

  const handleToggleNews = (index) => {
    setExpandedNewsIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });

    if (typeof toggleNews === 'function') {
      toggleNews(index);
    }
  };

  return (
    <section className="news-container">
      <h3>Новости по компании</h3>
      <SimpleBar
        style={{ maxHeight: 400 }}
        scrollableNodeProps={{ ref: newsContainerRef }}
      >
        <ul>
          {safeNews.slice(0, visibleNewsCount).map((item, index) => {
            const isExpanded = Boolean(item.isExpanded || expandedNewsIndexes.has(index));

            return (
              <li key={`${item.uniqueId}-${index}`} className="news-item">
                <button
                  className="news-title"
                  onClick={() => handleToggleNews(index)}
                >
                  <em>{item.title}</em>
                  <span className="news-date">{safeFormatDate(item.date)}</span>
                </button>
                {isExpanded && (
                  <div className="news-content">
                    <p>{item.content}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-link"
                    >
                      Подробнее
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!isLoading && safeNews.length === 0 && (
          <div className="news-empty-state">
            Новостной контекст появится при наличии данных
          </div>
        )}

        {/* Лоадер для подгрузки новых новостей */}
        <div ref={loaderRef} style={{ height: '20px' }} />

        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </SimpleBar>
    </section>
  );
};

export default React.memo(News);
