import React from 'react';
import styles from './DashboardColumn.module.css';

export default function WidgetCard({ title, children, onSettings }) {
  return (
    <section className={styles['widget-card']}>
      <header className={styles['widget-card__header']}>
        <strong className={styles['widget-card__title']}>{title}</strong>
        <button
          type="button"
          aria-label="Настройки"
          className={styles['widget-card__gear']}
          onClick={onSettings}
        >
          ⚙
        </button>
      </header>
      <div className={styles['widget-card__body']}>{children}</div>
    </section>
  );
}
