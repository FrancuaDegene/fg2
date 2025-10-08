import React, { useState, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import './News.css';

const News = ({ news, newsContainerRef, toggleNews, formatDate, isLoading }) => {
  const [visibleNewsCount, setVisibleNewsCount] = useState(10); // Показываем первые 10
  const loaderRef = useRef(null);

  // Обработчик скролла для подгрузки новостей
  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setVisibleNewsCount((prev) => Math.min(prev + 5, news.length)); // Подгружаем по 5
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoaderRef) observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) observer.unobserve(currentLoaderRef);
    };
  }, [isLoading, news.length]);

  return (
    <section className="news-container">
      <h3>Новости по компании</h3>
      <SimpleBar
        style={{ maxHeight: 400 }}
        scrollableNodeProps={{ ref: newsContainerRef }}
      >
        <ul>
          {news.slice(0, visibleNewsCount).map((item, index) => (
            <li key={`${item.uniqueId}-${index}`} className="news-item">
              <button
                className="news-title"
                onClick={() => toggleNews(index)}
              >
                <em>{item.title}</em>
                <span className="news-date">{formatDate(item.date)}</span> {/* <<< ИСПРАВЛЕНО */}
              </button>
              {item.isExpanded && (
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
          ))}
        </ul>

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