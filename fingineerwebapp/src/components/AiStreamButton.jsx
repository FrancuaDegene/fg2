import React, { useRef, useState } from 'react';
import { streamAI } from '../api/aiService';

export default function AiStreamButton() {
  const [prompt, setPrompt] = useState('Что такое ETF? Дай кратко, по-русски.');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const stopRef = useRef(null);

  function startStream() {
    if (!prompt.trim() || loading) return;
    setAnswer('');
    setLoading(true);

    // стартуем стрим по текущему prompt
    stopRef.current = streamAI(
      prompt.trim(),
      (chunk) => {
        // аккуратно дописываем кусочки без лишних пробелов
        setAnswer((prev) => (prev || '') + chunk);
      },
      () => setLoading(false) // onEnd / onError
    );
  }

  function stopStream() {
    stopRef.current?.();
    stopRef.current = null;
    setLoading(false);
  }

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 700 }}>
      <label style={{ fontSize: 14, color: '#666' }}>Промпт (живой стрим):</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: 10, borderRadius: 8 }}
        placeholder="Введите вопрос…"
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={startStream} disabled={loading || !prompt.trim()}>
          {loading ? 'Стриминг…' : 'AI стрим'}
        </button>
        <button onClick={stopStream} disabled={!loading}>Стоп</button>
      </div>

      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{answer}</pre>
    </div>
  );
}
