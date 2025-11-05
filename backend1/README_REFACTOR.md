# Архитектура backend1 (после рефакторинга)

## Структура каталога
```
backend1/
├─ app.js                  # Тонкий bootstrap сервера
├─ .env.example            # Шаблон окружения
├─ config/
│  ├─ env.js               # Парсинг .env, валидация значений
│  ├─ cors.js              # CORS‑middleware на основе ALLOWED_ORIGINS
│  └─ rateLimit.js         # Настройки express-rate-limit
├─ services/
│  ├─ db.js                # MySQL pool + getAggregatedCandles
│  ├─ cache.js             # redis.createClient, get/set/quit
│  └─ ai.js                # Инициализация OpenAI клиента/мока
├─ routes/
│  ├─ ticker.js            # GET /api/ticker/:searchQuery
│  ├─ news.js              # GET /api/news (кеширование)
│  ├─ dividends.js         # GET /api/dividends (моковый ответ)
│  └─ chat.js              # POST /api/chat, GET /api/chat-stream, GET /api/ai/debug
├─ sockets/
│  └─ candlesSocket.js     # Socket.IO события requestChartData/initialData/updateData
├─ middlewares/
│  └─ errorHandler.js      # Глобальный обработчик ошибок
└─ utils/
   ├─ logger.js            # Единый логгер (info/warn/error/debug)
   ├─ validators.js        # Санитизация входных параметров
   └─ candles.js           # formatDateLocal, intervalToMs, makeMockBars, candlesToBars
```

## Поток и зависимости
```
     config/env.js
          ↓
app.js → helmet/cors/rateLimit → routes/* → services/{db,cache,ai}
                                     ↓
                              utils/{validators,logger}

Socket.IO (sockets/candlesSocket.js) → services/db + utils/candles + services/cache
```

### `app.js`
- Загружает конфиг (`config/env.js`), поднимает Express и HTTP‑сервер.
- Подключает `helmet`, `corsMiddleware`, `readLimiter`, `express.json`.
- Монтирует маршруты `/api` из директории `routes`.
- Отдаёт статический фронт (если присутствует) + `/health`.
- Инициализирует `socket.io` и делегирует обработку `candlesSocket`.
- Обрабатывает `SIGINT/SIGTERM`: закрывает Socket.IO, HTTP‑сервер, Redis (`services/cache.quit`) и MySQL (`services/db.closePool`).

### `config/*`
- `env.js` — парсит `.env`, проверяет обязательные переменные (DB_*, REDIS_URL, OPENAI_*). Предупреждает, если `PORT == DB_PORT`. Возвращает объект конфигурации.
- `cors.js` — строит whitelist из `ALLOWED_ORIGINS`, разрешает запросы без Origin только в dev.
- `rateLimit.js` — экспортирует `readLimiter` (для всех `/api`) и `chatLimiter` (используется роутами чата).

### `services/*`
- `db.js` — создаёт pool `mysql.createPool`, выполняет SQL агрегацию свечей (`getAggregatedCandles`), пишет результат в Redis; ограничивает результат 3000 свечей, управляет подключением.
- `cache.js` — Redis v4 (`redis.createClient`). Методы `get`, `set` (с TTL из config), `quit`.
- `ai.js` — инициализирует OpenAI (или `mock`, если `OPENAI_MOCK=1`). Предоставляет `getClient`, `hasKey`, `isMock`, `getModel`.

### `routes/*`
- `ticker.js` — GET `/api/ticker/:searchQuery`. Использует MySQL через `services/db` (через старый формат — пока без пулов) и отдаёт расширенный снапшот.
- `news.js` — GET `/api/news`. Читает кэш `news_all`; при промахе обращается к БД и записывает результат в Redis.
- `dividends.js` — GET `/api/dividends`. Пока возвращает статический массив (как и до рефакторинга).
- `chat.js`:
  - GET `/api/ai/debug` — проверка наличия ключа/модели OpenAI.
  - POST `/api/chat` — синхронный ответ OpenAI (или mock).
  - GET `/api/chat-stream` — SSE поток с поддержкой mock и OpenAI Responses API.

Маршруты используют `utils/validators` (санитизация) и `utils/logger` для логов.

### `sockets/candlesSocket.js`
- Обрабатывает подключения Socket.IO (`requestChartData`, `initialData`, `updateData`, `error`).
- Использует `services/db.getAggregatedCandles` + `services/cache`.
- Форматирует свечи через `utils/candles` (toUnixSeconds, makeMockBars и т.д.).
- Управляет таймером обновления, очищает его при `disconnect`.

### `middlewares/errorHandler.js`
- Ловит исключения в маршрутах.
- Возвращает JSON `{ error }` со статусом (400/404/500).

### `utils/*`
- `logger.js` — единый интерфейс логирования с префиксами `[server]`, `[db]`, `[route/*]`, `[socket id]`.
- `validators.js` — `sanitizeTicker`, `sanitizeSearchQuery` и т.д.
- `candles.js` — функции форматирования дат, интервалов и генерация моковых свечей.

## Окружение (`.env`)
Минимально требуется:
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000
CACHE_TTL_SEC=3600
OPENAI_API_KEY=... (или OPENAI_MOCK=1)
OPENAI_MODEL=gpt-4.1-nano
```

## Как работает поток данных
1. **REST**: запрос приходит через `app.js` → проходит `helmet`, `cors`, `readLimiter` → попадает в соответствующий роут → роут использует сервисы (`db`, `cache`, `ai`) → результат отправляется в ответ. Ошибки перехватывает `errorHandler`.
2. **Socket.IO**: клиент подключается через `app.js` → `candlesSocket` подписывается на события → `getAggregatedCandles` отдаёт свечи (с кешем Redis) → данные трансформируются в нужный формат и уходят обратно клиенту.
3. **Чат**: `routes/chat` вызывает `services/ai` (реальный OpenAI или mock), применяет JSON Schema и отдаёт ответ/стрим.

Такое разделение облегчает тестирование (каждый модуль отдельно), уменьшает связность и готовит сервис к деплою в k3s/Rancher.
