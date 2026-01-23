import { useCallback, useEffect, useState } from 'react';
import styles from './InstrumentPassport.module.css';
import { PulseBlock } from './PulseBlock';

export function InstrumentPassport({
  ticker,
  exchange,
  instrumentType,
  sector,
  sessionName,
  pulseData,
  size = 'full',
}) {
  const safeTicker = typeof ticker === 'string' ? ticker.trim() : '';
  const avatarLabel = safeTicker ? safeTicker[0].toUpperCase() : '?';
  const subtitleParts = [exchange, instrumentType].filter(Boolean);
  const isCompact = size === 'compact';

  const [activeHint, setActiveHint] = useState(null);

  const handleHintEnter = useCallback((key) => {
    setActiveHint(key);
  }, []);

  const handleHintLeave = useCallback((key) => {
    setActiveHint((prev) => (prev === key ? null : prev));
  }, []);

  const handleHintToggle = useCallback((event, key) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveHint((prev) => (prev === key ? null : key));
  }, []);

  const tooltipId = useCallback((key) => `passport-hint-${key}`, []);

  useEffect(() => {
    if (!activeHint) return;

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setActiveHint(null);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [activeHint]);

  return (
    <article
      className={`${styles.passport} ${isCompact ? styles.compact : ''}`}
      data-size={size}
    >
      <header className={styles.header}>
        <div className={styles.summary}>
          <div className={styles.avatar} aria-hidden="true">
            {avatarLabel}
          </div>
          <div className={styles.tickerBlock}>
            <span className={styles.ticker} aria-label={`Тикер ${safeTicker}`}>
              {safeTicker || '—'}
            </span>
            <span className={styles.metaLine}>
              {subtitleParts.length > 0 ? subtitleParts.join(' · ') : '—'}
            </span>
          </div>
        </div>
        <div className={styles.pulseWrapper}>
          <PulseBlock pulseData={pulseData} ticker={safeTicker} />
        </div>
      </header>

      <section className={styles.metaSection}>
        {!isCompact && (
          <div className={styles.divider} role="presentation" />
        )}

        <div className={styles.metaGrid}>
          <div className={styles.metaColumn}>
            <span className={styles.metaLabel}>
              <span className={styles.metaLabelText}>Сектор</span>
              <button
                type="button"
                className={styles.infoHintBtn}
                aria-label="Подсказка: Сектор"
                aria-describedby={tooltipId('sector')}
                aria-expanded={activeHint === 'sector' ? 'true' : 'false'}
                aria-haspopup="true"
                onClick={(event) => handleHintToggle(event, 'sector')}
                onMouseEnter={() => handleHintEnter('sector')}
                onMouseLeave={() => handleHintLeave('sector')}
                onFocus={() => handleHintEnter('sector')}
                onBlur={() => handleHintLeave('sector')}
                data-active={activeHint === 'sector' ? '1' : undefined}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path
                    d="M12 16V12M12 8H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span
                id={tooltipId('sector')}
                role="tooltip"
                className={styles.hintTooltip}
                data-visible={activeHint === 'sector' ? '1' : '0'}
                aria-hidden={activeHint === 'sector' ? 'false' : 'true'}
              >
                Сектор листинга / отраслевая группа
              </span>
            </span>
            <span className={styles.metaValue}>{sector || '—'}</span>
          </div>
          <div className={styles.metaColumn}>
            <span className={styles.metaLabel}>
              <span className={styles.metaLabelText}>Сессия</span>
              <button
                type="button"
                className={styles.infoHintBtn}
                aria-label="Подсказка: Сессия"
                aria-describedby={tooltipId('session')}
                aria-expanded={activeHint === 'session' ? 'true' : 'false'}
                aria-haspopup="true"
                onClick={(event) => handleHintToggle(event, 'session')}
                onMouseEnter={() => handleHintEnter('session')}
                onMouseLeave={() => handleHintLeave('session')}
                onFocus={() => handleHintEnter('session')}
                onBlur={() => handleHintLeave('session')}
                data-active={activeHint === 'session' ? '1' : undefined}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path
                    d="M12 16V12M12 8H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span
                id={tooltipId('session')}
                role="tooltip"
                className={styles.hintTooltip}
                data-visible={activeHint === 'session' ? '1' : '0'}
                aria-hidden={activeHint === 'session' ? 'false' : 'true'}
              >
                Какая торговая сессия активна (основная, вечерняя, аукцион)
              </span>
            </span>
            <span className={styles.metaValue}>{sessionName || '—'}</span>
          </div>
        </div>
      </section>

      <div className={styles.ctaRow}>
        <button type="button" className={styles.ctaButton}>
          Сравнить
        </button>
        <button type="button" className={styles.ctaButtonSecondary}>
          Новости
        </button>
      </div>
    </article>
  );
}
