import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PulseBlock.module.css';
import { calcSparklinePoints } from '../../utils/calcSparklinePoints';

const SPARKLINE_WIDTH = 90;
const SPARKLINE_HEIGHT = 28;

export function PulseBlock({ pulseData, ticker }) {
  const rawDelta = pulseData?.deltaPct;
  const numericDelta = typeof rawDelta === 'number' ? rawDelta : Number(rawDelta);
  const safeDelta = Number.isFinite(numericDelta) ? numericDelta : 0;

  // Подготовка точек для polyline
  const { pointsString } = useMemo(() => {
    const closes = Array.isArray(pulseData?.closes) ? pulseData.closes : [];
    if (closes.length < 2) {
      return { pointsString: '' };
    }
    return calcSparklinePoints(closes, SPARKLINE_WIDTH, SPARKLINE_HEIGHT);
  }, [pulseData?.closes]);

  // polyline dom-ref
  const polyRef = useRef(null);

  // Управляем фазой анимации
  // 'idle'   — нет линии вообще (placeholder)
  // 'hidden' — линия смонтирована, но strokeDashoffset=1 (невидимо)
  // 'anim'   — мы вручную крутим offset -> 0
  // 'done'   — линия полностью показана
  const [phase, setPhase] = useState('idle');

  // Когда меняется тикер:
  // - если нет данных (placeholder) -> phase='idle'
  // - если данные есть -> сначала ставим phase='hidden'
  useEffect(() => {
    if (!ticker || pointsString.length === 0) {
      setPhase('idle');
      return;
    }
    setPhase('hidden');
  }, [ticker, pointsString]);

  // Когда вошли в 'hidden', сразу в следующий frame переходим в 'anim'
  useEffect(() => {
    if (phase !== 'hidden') return;
    // запускаем после layout, чтобы polyline реально успел отрендериться скрытым
    const id = requestAnimationFrame(() => {
      setPhase('anim');
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);

  // Само плавное рисование, но только если мы в фазе 'anim'
  useEffect(() => {
    if (phase !== 'anim') return;
    const node = polyRef.current;
    if (!node) return;

    const duration = 1800; // мс
    let startTs = null;
    let rafId = null;

    // начальные стили перед анимацией
    node.style.strokeDasharray = '1';
    node.style.strokeDashoffset = '1';

    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1); // 0..1
      const offsetNow = 1 - progress; // идём от 1 к 0
      node.style.strokeDashoffset = String(offsetNow);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // после завершения оставляем нормальный вид и фиксируем фазу done
        node.style.strokeDasharray = '';
        node.style.strokeDashoffset = '';
        setPhase('done');
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [phase]);

  const lineColor =
    safeDelta >= 0
      ? 'var(--fg-positive-color, #1f8a5f)'
      : 'var(--fg-negative-color, #d1433f)';

  const formattedDelta = `${safeDelta >= 0 ? '+' : ''}${safeDelta.toFixed(2)}% · 1ч`;

  const showPlaceholder = pointsString.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.sparklineWrapper}>
        <svg
          key={ticker}
          className={styles.sparkline}
          width={SPARKLINE_WIDTH}
          height={SPARKLINE_HEIGHT}
          viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
          role="img"
          aria-hidden="true"
        >
          {showPlaceholder ? (
            <line
              className={styles.sparklinePlaceholder}
              x1="0"
              y1={SPARKLINE_HEIGHT / 2}
              x2={SPARKLINE_WIDTH}
              y2={SPARKLINE_HEIGHT / 2}
              stroke="#b0b7c3"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ) : (
            <polyline
              ref={polyRef}
              className={styles.sparklineLine}
              points={pointsString}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              // pathLength="1" даёт нормализацию: strokeDashoffset=1 == "вся линия скрыта"
              pathLength="1"
              // КРИТИЧЕСКО: в фазе 'hidden' мы РЕНДЕРИМ скрытую линию уже на первом проходе,
              // чтобы не было флеша полной линии до старта анимации.
              style={
                phase === 'hidden'
                  ? {
                      strokeDasharray: '1',
                      strokeDashoffset: '1',
                    }
                  : undefined
              }
            />
          )}
        </svg>
      </div>

      <span
        className={`${styles.delta} ${
          safeDelta >= 0 ? styles.deltaPositive : styles.deltaNegative
        }`}
        aria-label={`За последний час: ${safeDelta.toFixed(2)} процентов`}
      >
        {formattedDelta}
      </span>
    </div>
  );
}
