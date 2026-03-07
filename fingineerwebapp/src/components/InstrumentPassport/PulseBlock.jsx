import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PulseBlock.module.css';
import { calcSparklinePoints } from '../../utils/calcSparklinePoints';

const SPARKLINE_WIDTH = 90;
const SPARKLINE_HEIGHT = 28;

// One-shot memory across unmounts (Expanded <-> Compact).
const FG_SPARK_SEEN = new Map(); // key -> ts
const FG_SPARK_SEEN_MAX = 500;

const hashString = (value) => {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) + h) + value.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
};

const markSparkSeen = (key) => {
  if (!key) return;
  FG_SPARK_SEEN.set(key, Date.now());
  if (FG_SPARK_SEEN.size <= FG_SPARK_SEEN_MAX) return;
  const entries = Array.from(FG_SPARK_SEEN.entries());
  entries.sort((a, b) => (a[1] || 0) - (b[1] || 0));
  const removeCount = Math.max(1, Math.floor(FG_SPARK_SEEN_MAX * 0.2));
  for (let i = 0; i < removeCount; i += 1) {
    FG_SPARK_SEEN.delete(entries[i][0]);
  }
};

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

  // Стабильная сигнатура формы (НЕ зависит от ссылки массива)
  const shapeSig = useMemo(() => {
    return pointsString ? hashString(pointsString) : 0;
  }, [pointsString]);

  const pointsArr = useMemo(() => {
    if (!pointsString) return [];
    return pointsString
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(',').map((n) => Number(n));
        return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
      })
      .filter(Boolean);
  }, [pointsString]);

  // polyline dom-ref
  const polyRef = useRef(null);
  const headRef = useRef(null);

  // Управляем фазой анимации
  // 'idle'   — нет линии вообще (placeholder)
  // 'hidden' — линия смонтирована, но strokeDashoffset=1 (невидимо)
  // 'anim'   — мы вручную крутим offset -> 0
  // 'done'   — линия полностью показана
  const [phase, setPhase] = useState('idle');
  const pendingSeenKeyRef = useRef(null);

  // Когда меняется тикер:
  // - если нет данных (placeholder) -> phase='idle'
  // - если данные есть -> сначала ставим phase='hidden'
  useEffect(() => {
    if (!ticker || pointsString.length === 0) {
      setPhase('idle');
      pendingSeenKeyRef.current = null;
      if (headRef.current) headRef.current.style.opacity = '0';
      return;
    }
    const t = String(ticker || '').trim().toUpperCase() || 'NA';
    const sig = shapeSig;
    const seenKey = `${t}|${sig}`;
    if (FG_SPARK_SEEN.has(seenKey)) {
      pendingSeenKeyRef.current = null;
      setPhase('done');
      if (headRef.current) headRef.current.style.opacity = '0';
      return;
    }
    pendingSeenKeyRef.current = seenKey;
    setPhase('hidden');
  }, [ticker, shapeSig]);

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

    // Проверка на prefers-reduced-motion
    try {
      if (window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
        setPhase('done');
        const k = pendingSeenKeyRef.current;
        if (k) markSparkSeen(k);
        pendingSeenKeyRef.current = null;
        if (headRef.current) headRef.current.style.opacity = '0';
        return;
      }
    } catch {}

    // Progressive draw (hand-drawn ECG).
    const N = pointsArr.length;
    if (N < 2) {
      setPhase('done');
      const k = pendingSeenKeyRef.current;
      if (k) markSparkSeen(k);
      pendingSeenKeyRef.current = null;
      if (headRef.current) headRef.current.style.opacity = '0';
      return;
    }

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const durationMs = clamp(N * 28, 900, 1800);
    let startTs = null;
    let rafId = null;
    const headElement = headRef.current;
    const toPointsAttr = (arr) => arr.map(([x, y]) => String(x) + ',' + String(y)).join(' ');

    node.style.strokeDasharray = '';
    node.style.strokeDashoffset = '';
    node.setAttribute('points', toPointsAttr(pointsArr.slice(0, 2)));

    if (headElement) {
      if (N >= 1) {
        const [x0, y0] = pointsArr[0];
        headElement.setAttribute('cx', String(x0));
        headElement.setAttribute('cy', String(y0));
      }
      headElement.style.opacity = '1';
    }

    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const linear = Math.min((ts - startTs) / durationMs, 1);
      const progress = 1 - Math.pow(1 - linear, 3);
      const count = Math.max(2, Math.min(N, Math.floor(progress * (N - 1)) + 1));
      node.setAttribute('points', toPointsAttr(pointsArr.slice(0, count)));

      if (headElement) {
        const idx = Math.max(0, Math.min(N - 1, count - 1));
        const [x, y] = pointsArr[idx] || pointsArr[N - 1];
        headElement.setAttribute('cx', String(x));
        headElement.setAttribute('cy', String(y));
      }

      if (linear < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        node.setAttribute('points', toPointsAttr(pointsArr));
        if (headElement) headElement.style.opacity = '0';
        const k = pendingSeenKeyRef.current;
        if (k) markSparkSeen(k);
        pendingSeenKeyRef.current = null;
        setPhase('done');
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      pendingSeenKeyRef.current = null;
      if (headElement) headElement.style.opacity = '0';
    };
  }, [phase, pointsString]);

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
            <>
              <polyline
                ref={polyRef}
                className={styles.sparklineLine}
                points={pointsString}
                fill="none"
                stroke={lineColor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                ref={headRef}
                r="1.6"
                fill={lineColor}
                opacity="0"
              />
            </>
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
