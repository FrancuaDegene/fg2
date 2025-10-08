const express = require('express');
const http = require('http');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cors = require('cors');
const socketIo = require('socket.io');
const redis = require('redis');
const getAggregatedCandles = require('./DB/getDataFromDatabase');
const OpenAI = require('openai');


dotenv.config();
console.log('[CFG] hasKey:', Boolean(process.env.OPENAI_API_KEY), 'model:', process.env.OPENAI_MODEL || 'gpt-4o');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

app.use(express.json());


// Подключение Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect().then(() => console.log('Redis connected')).catch(console.error);

// Подключение MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'fingineer',
  password: process.env.DB_PASSWORD || 'Vol32z51',
  database: process.env.DB_NAME || 'fingineer',
});
connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных MySQL:', err);
    return;
  }
  console.log('MySQL connected');
  connection.query("SET SESSION group_concat_max_len = 1000000", (err) => {
    if (err) console.error('[MySQL] group_concat_max_len error:', err);
  });
});

// Статические файлы
app.use(express.static(path.join(__dirname, '../frontend')));

// API: Получение информации о тикере
app.get('/api/ticker/:searchQuery', (req, res) => {
  const ticker = req.params.searchQuery?.toUpperCase();
  if (!ticker) return res.status(400).json({ error: 'Не указан тикер' });

  connection.query(
    "SELECT MAX(DATE(SYSTIME)) as maxDate FROM moex_marketdata WHERE SECID = ? AND BOARDID = 'TQBR'",
    [ticker],
    (err, rows) => {
      let defaultDate = '2023-01-02';
      if (err) {
        console.error('Ошибка при получении maxDate из БД:', err);
      } else if (rows && rows.length > 0 && rows[0].maxDate) {
        const dateObj = new Date(rows[0].maxDate);
        defaultDate = dateObj.toISOString().slice(0, 10);
      }

      res.json({
        ticker,
        companyName: `Название компании для ${ticker}`,
        date: defaultDate,
        time: '00:00:00',
        closingPrice: 'N/A',
        sector: 'Сектор Мосбиржи',
        exchange: 'Мосбиржа',
        dividendYield: 'N/A %',
      });
    }
  );
});

// API: Новости
app.get('/api/news', async (req, res) => {
  const cacheKey = 'news_all';
  try {
    const cachedNews = await redisClient.get(cacheKey);
    if (cachedNews) {
      return res.json(JSON.parse(cachedNews));
    } else {
      connection.query(
        'SELECT title, content, created_at FROM blog_posts ORDER BY created_at DESC',
        (error, results) => {
          if (error) {
            return res.status(500).json({ error: 'Ошибка сервера' });
          }
          redisClient.setEx(cacheKey, 300, JSON.stringify(results))
            .catch(err => console.error('Ошибка кеширования новостей:', err));
          res.json(results);
        }
      );
    }
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API: Дивиденды
app.get('/api/dividends', (req, res) => {
  res.json([
    { date: '2024-12-15', value: '1.50', currency: 'RUB', type: 'Годовые' },
    { date: '2024-06-30', value: '0.75', currency: 'RUB', type: 'Промежуточные' },
  ]);
});
 


// >>> ВСТАВЬ СЮДА ↓↓↓
app.get('/api/ai/debug', (req, res) => {
  res.json({
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    node: process.version,
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required (string)' });
    }
    if (process.env.OPENAI_MOCK === '1') {
  return res.json({ answer: 'FG OpenAI mock: интеграция работает ✅' });
}


    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'developer', content: 'You are a helpful assistant for an investment web app.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
      temperature: 0.7,
    });

    const answer = completion.choices?.[0]?.message?.content ?? '';
    return res.json({ answer });
  } catch (err) {
    console.error('[OpenAI] error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'OpenAI request failed' });
  }
});

// Форматирование даты
function formatDateLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Потоковый ответ (SSE) — работает и в MOCK, с корректной UTF-8 кодировкой
app.get('/api/chat-stream', async (req, res) => {
  // Заголовки SSE: явная UTF-8, отключение буферизации у прокси
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // для nginx/Cloudflare

  // Немедленно отправляем заголовки
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  // Утилита отправки событий/данных
  const send = (event, data) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n\n`);
  };

  // Поддерживаем соединение "живым"
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    try { res.end(); } catch (_) {}
  };

  // Если клиент закрыл соединение — прибираемся
  req.on('close', cleanup);

  try {
    const prompt = String(req.query.prompt || '');
    if (!prompt) {
      res.status(400);
      send('error', 'prompt is required');
      return cleanup();
    }

    // MOCK поток: имитируем «капание» текста (кириллица теперь ок)
    if (process.env.OPENAI_MOCK === '1') {
      const text = 'FG OpenAI mock (stream): интеграция работает ✅';
      for (const word of text.split(' ')) {
        send('', word); // пустое имя события => обычное onmessage
        await new Promise(r => setTimeout(r, 80));
      }
      send('end', 'done');
      return cleanup();
    }

    // Реальный стрим через OpenAI (заработает, когда будут кредиты)
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'developer', content: 'You are a helpful assistant for an investment web app.' },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 512,
    });

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) send('', delta);
    }

    send('end', 'done');
    return cleanup();
  } catch (e) {
    send('error', e?.message || 'unknown');
    return cleanup();
  }
});


// WebSocket
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('requestChartData', async ({ ticker, timeframe, interval, selectedDate }) => {
    if (!ticker || !interval || !timeframe || !selectedDate) {
      return socket.emit('error', { message: 'Некорректные параметры запроса графика' });
    }

    const end = new Date(`${selectedDate}T23:59:59+03:00`);
    const start = new Date(end);

    switch (timeframe) {
      case '5d': start.setDate(end.getDate() - 4); break;
      case '1mth': start.setMonth(end.getMonth() - 1); break;
      case '3mth': start.setMonth(end.getMonth() - 3); break;
      case '6mth': start.setMonth(end.getMonth() - 6); break;
      case '1y': start.setFullYear(end.getFullYear() - 1); break;
      case 'all': start.setFullYear(2000); break;
      default: start.setHours(6, 50, 0, 0); end.setHours(23, 50, 0, 0);
    }

    const startStr = formatDateLocal(start);
    const endStr = formatDateLocal(end);

    try {
      const candles = await getAggregatedCandles(
        ticker,
        interval,
        startStr,
        endStr
      );
      socket.emit('initialData', { candles });
    } catch (err) {
      console.error('[WS] Ошибка при загрузке графика:', err);
      socket.emit('error', { message: 'Ошибка загрузки данных графика' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
