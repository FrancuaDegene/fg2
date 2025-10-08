import config from '../config/api';; // путь поправь, если у тебя другой
export async function askAI(prompt) {
  const res = await fetch(`${config.API_BASE_URL}${config.ENDPOINTS.AI_CHAT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.answer;
}

// Опционально: стриминг через SSE
export function streamAI(prompt, onChunk, onEnd) {
  const url = `${config.API_BASE_URL}${config.ENDPOINTS.AI_CHAT_STREAM}?prompt=${encodeURIComponent(prompt)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => onChunk(e.data);
  es.addEventListener('end', () => { es.close(); onEnd?.(); });
  es.onerror = () => { es.close(); onEnd?.(); };
  return () => es.close(); // на случай отмены
}

