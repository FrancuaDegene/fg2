import React, { useState, useRef, useEffect } from 'react';
import { streamAI } from '../api/aiService';

export default function AiStreamButton() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const stopRef = useRef(null);

  const start = () => {
    if (loading) return;
    setAnswer('');
    setLoading(true);

    stopRef.current = streamAI(
      'Проверка стрима: короткая фраза что интеграция работает.',
      (chunk) => {
        // наши SSE-события приходят по словам — аккуратно склеиваем
        setAnswer((prev) => (prev ? prev + ' ' + chunk : chunk));
      },
      () => setLoading(false) // onEnd
    );
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setLoading(false);
  };

  useEffect(() => () => stopRef.current?.(), []);

  return (
    <div style={{ padding: 8 }}>
      <button onClick={start} disabled={loading}>
        {loading ? 'Стримим…' : 'AI стрим'}
      </button>
      {loading && (
        <button onClick={stop} style={{ marginLeft: 8 }}>
          Стоп
        </button>
      )}
      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{answer}</div>
    </div>
  );
}
