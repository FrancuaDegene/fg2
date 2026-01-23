import React, { useState } from 'react';

export default function AiTestButton() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      setAnswer('Загрузка…');
      // TODO: вернуть вызов askAI(...) когда снова включим AI
      const txt = await Promise.resolve('AI временно отключен (quota).');
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
