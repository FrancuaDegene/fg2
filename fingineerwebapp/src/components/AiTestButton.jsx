import React, { useState } from 'react';
import { askAI } from '../api/aiService';

export default function AiTestButton() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      setAnswer('Загрузка…');
      const txt = await askAI('Привет! Скажи одно короткое предложение, что интеграция работает.');
      setAnswer(txt);
    } catch (e) {
      setAnswer(`Ошибка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Ждём…' : 'AI тест'}
      </button>
      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{answer}</div>
    </div>
  );
}
