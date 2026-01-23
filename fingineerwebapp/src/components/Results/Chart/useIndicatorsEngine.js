// src/components/chart/useIndicatorsEngine.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * Хук-движок индикаторов.
 * Инкапсулирует web-worker и кэш. Ничего не знает о React-UI/чарте.
 * Контракт сообщений совпадает с текущим indicators.worker.js:
 * post:  { id, type, payload }
 * reply: { id, ok, data, error }
 */
export function useIndicatorsEngine() {
  const workerRef = useRef(null);
  const ridRef = useRef(0);
  const inflightRef = useRef(new Map());  // id -> {resolve, reject}
  const cacheRef = useRef(new Map());     // key -> data

 useEffect(() => {
  workerRef.current = new Worker(
    new URL('../../../indicators/indicators.worker.js', import.meta.url),
    { type: 'module' }
  );
  const w = workerRef.current;

  // Захватываем текущую Map в локальную переменную
  const inflight = inflightRef.current;

  const onMsg = (e) => {
    const { id, ok, data, error } = e.data || {};
    const p = inflight.get(id);
    if (!p) return;
    inflight.delete(id);
    ok ? p.resolve(data) : p.reject(error);
  };

  w.addEventListener('message', onMsg);

  return () => {
    try { w.removeEventListener('message', onMsg); } catch {}
    try { w.terminate(); } catch {}
    workerRef.current = null;
    inflight.clear();
  };
}, []);


  const run = useCallback((type, payload, key) => {
    const cache = cacheRef.current;
    const MAX_CACHE = 25;
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }

    const k = key ?? JSON.stringify({ type, payload });
    if (cache.has(k)) return Promise.resolve(cache.get(k));

    const w = workerRef.current;
    if (!w) return Promise.reject(new Error('Worker not ready'));

    const id = ++ridRef.current;
    return new Promise((resolve, reject) => {
      inflightRef.current.set(id, {
        resolve: (d) => { cache.set(k, d); resolve(d); },
        reject
      });
      w.postMessage({ id, type, payload });
    });
  }, []);

  // Готовые фасады под имеющиеся индикаторы
  const sma = useCallback((data, period) => run('SMA', { data, period }), [run]);
  const ema = useCallback((data, period) => run('EMA', { data, period }), [run]);
  const rsi = useCallback((data, period) => run('RSI', { data, period }), [run]);

  return { sma, ema, rsi, run };
}
