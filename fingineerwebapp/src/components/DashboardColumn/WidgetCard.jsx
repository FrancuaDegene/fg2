import React from 'react';
import styles from './DashboardColumn.module.css';

export default function WidgetCard({ title, children, onSettings }) {
  return (
    <section className={styles.widget}>
      <header className={styles.widget__header}>
        <strong className={styles.widget__title}>{title}</strong>
        <button
          type="button"
          className={styles.widget__settings}
          aria-label="Настройки виджета"
          onClick={onSettings}
        >
          ⚙
        </button>
      </header>
      <div>{children}</div>
    </section>
  );
}
