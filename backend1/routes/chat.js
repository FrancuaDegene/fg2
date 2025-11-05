const express = require('express');
const { getClient, getModel, hasKey, isMock } = require('../services/ai');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/ai/debug', (req, res) => {
  res.json({
    hasKey: hasKey(),
    model: getModel(),
    node: process.version,
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, context = '' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required (string)' });
    }

    if (isMock()) {
      return res.json({ answer: 'FG OpenAI mock: интеграция работает ✅' });
    }

    const SYSTEM = `
Ты ассистент Fingineer (FG). Отвечай кратко и по-русски.
Никогда не проси уточнений — если данных мало, делай разумные предположения.
Если пользователь просит N пунктов/идей — верни ровно N пунктов с текстом, а не числа.
Формат по умолчанию для "2 идеи": 
1) <краткое название, ≤6 слов> — <одним предложением польза для пользователя>
2) <краткое название, ≤6 слов> — <одним предложением польза для пользователя>
`.trim();

    const openai = getClient();
    const response = await openai.responses.create({
      model: getModel(),
      temperature: 0.3,
      max_output_tokens: 512,
      text: {
        format: {
          type: 'json_schema',
          name: 'FGAnswer',
          strict: true,
          schema: {
            type: 'object',
            properties: { text: { type: 'string' } },
            required: ['text'],
            additionalProperties: false,
          },
        },
      },
      input: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Вопрос: ${prompt}\nКонтекст:\n${context || '—'}` },
      ],
    });

    const parsed = JSON.parse(response.output_text);
    return res.json({ answer: parsed.text, usage: response.usage });
  } catch (err) {
    logger.error('route/chat', 'OpenAI chat error', err?.response?.data || err);
    const msg = (err?.status === 429 || String(err).includes('quota'))
      ? 'INSUFFICIENT_QUOTA'
      : 'OpenAI request failed';
    return res.status(500).json({ error: msg });
  }
});

router.get('/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const send = (event, data) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n\n`);
  };

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    try {
      res.end();
    } catch (err) {
      logger.debug('route/chat', 'SSE cleanup error', err);
    }
  };

  req.on('close', cleanup);

  try {
    const prompt = String(req.query.prompt || '');
    if (!prompt) {
      res.status(400);
      send('error', 'prompt is required');
      return cleanup();
    }

    if (isMock()) {
      const text = 'FG OpenAI mock (stream): интеграция работает ✅';
      for (const word of text.split(' ')) {
        send('', word);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      send('end', 'done');
      return cleanup();
    }

    const openai = getClient();
    const SYSTEM = `Ты ассистент Fingineer (FG). Отвечай кратко, по-русски.`.trim();

    const stream = await openai.responses.stream({
      model: getModel(),
      temperature: 0.3,
      max_output_tokens: 512,
      input: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    });

    stream.on('response.output_text.delta', (event) => {
      if (event?.delta) {
        send('', event.delta);
      }
    });

    stream.on('response.completed', () => {
      send('end', 'done');
      cleanup();
    });

    stream.on('error', (err) => {
      logger.error('route/chat', 'OpenAI stream error', err);
      send('error', err?.message || 'unknown');
      cleanup();
    });
  } catch (err) {
    logger.error('route/chat', 'Failed to start chat stream', err);
    send('error', err?.message || 'unknown');
    cleanup();
  }
});

module.exports = router;
