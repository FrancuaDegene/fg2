// src/api/aiService.js
import config from '../config/api'; // путь поправь, если у тебя другой

/**
 * Обычный запрос к /api/chat
 * @param {string} prompt
 * @param {string} [context] – доп. контекст для модели (по умолчанию пусто)
 * @param {boolean} [returnUsage=false] – вернуть {answer, usage}, если true
 * @returns {Promise<string|{answer:string, usage:any}>}
 */
export async function askAI(prompt, context = "", returnUsage = false) {
  const res = await fetch(`${config.API_BASE_URL}${config.ENDPOINTS.AI_CHAT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }
  const data = await res.json(); // { answer, usage }
  return returnUsage
    ? { answer: data.answer ?? "", usage: data.usage ?? null }
    : (data.answer ?? "");
}

/**
 * Стрим через SSE к /api/chat-stream
 * @param {string} prompt
 * @param {(chunk:string)=>void} onChunk
 * @param {()=>void} onEnd
 * @returns {() => void} stop – функция для остановки стрима
 */
export function streamAI(prompt, onChunk, onEnd) {
  const url = `${config.API_BASE_URL}${config.ENDPOINTS.AI_CHAT_STREAM}?prompt=${encodeURIComponent(prompt)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => onChunk && onChunk(e.data);
  es.addEventListener('end', () => { es.close(); onEnd && onEnd(); });
  es.onerror = () => { es.close(); onEnd && onEnd(); };
  return () => es.close(); // на случай отмены
}
