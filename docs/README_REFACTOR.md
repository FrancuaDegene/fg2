# Архитектура backend2 (после рефакторинга)

## Структура каталога
```
backend2/
├─ app.js                  # Тонкий bootstrap сервера
├─ .env.example            # Шаблон окружения
├─ config/
│  ├─ env.js               # Парсинг .env, валидация значений
│  ├─ cors.js              # CORS‑middleware
│  └─ rateLimit.js         # Настройки express-rate-limit
├─ services/
│  ├─ db.js                # mysql2/promise pool, бизнес-запросы
│  └─ cache.js             # ioredis клиент (кеш новостей)
├─ routes/
│  ├─ suggestions.js       # GET /api/suggestions/:query
│  ├─ ticker.js            # GET /api/ticker/:ticker
│  ├─ news.js              # GET /api/news (с кешем)
│  └─ dividends.js         # GET /api/dividends?searchQuery=...
├─ middlewares/
│  └─ errorHandler.js      # Глобальный обработчик ошибок
└─ utils/
   ├─ logger.js            # Единый логгер (info/warn/error/debug)
   └─ validators.js        # Санитизация входных параметров
```

## Поток и зависимости
```
     config/env.js
          ↓
app.js → helmet/cors/rateLimit → routes/* → services/{db,cache}
                                     ↓
                              utils/{validators,logger}
```

### `app.js`
- Загружает конфиг (`config/env.js`), инициализирует Express + HTTP.
- Подключает `helmet`, `corsMiddleware`, `readLimiter`, `express.json`.
- Отдаёт статические файлы (`public`, `node_modules/bootstrap`) и `/health`.
- Монтирует REST маршруты `/api/*`.
- Обрабатывает завершение (`SIGINT/SIGTERM`): закрывает HTTP‑сервер, Redis (`services/cache.quit`) и MySQL (`services/db.closePool`).

### `config/*`
- `env.js` — читает `.env`, проверяет обязательные переменные (`DB_*`, `REDIS_URL`), предупреждает если `PORT == DB_PORT`. Возвращает объект конфигурации (порт, whitelist origins, лимиты, TTL кеша).
- `cors.js` — строит whitelist из `ALLOWED_ORIGINS`; запросы без Origin разрешаются только в dev.
- `rateLimit.js` — экспортирует `readLimiter` (используется на `/api/*`). `chatLimiter` оставлен заделом (сейчас не используется).

### `services/*`
- `db.js`
  - Создаёт пул `mysql2/promise` с `waitForConnections`, `connectTimeout`, `connectionLimit`.
  - Выполняет SQL‑запросы:
    - `getSuggestions(query)` — поиск по `ticker_mapping` с приоритизацией совпадения в начале и лимитом.
    - `getTickerSnapshot(ticker)` — агрегирует данные из `moex_securities`, `moex_marketdata`, `tgbot_ticker_list`.
    - `getNews()` — выбирает ленту `blog_posts`.
    - `getDividends(searchQuery)` — выгружает дивиденды по `secid` из `moex_dividend_yields`.
  - Метод `closePool()` — аккуратное закрытие пула.
- `cache.js` — клиент `ioredis`. Методы `get`, `set` (TTL из config), `quit`. Используется в маршруте `/api/news`.

### `routes/*`
- `suggestions.js` — GET `/api/suggestions/:query`. Проверяет ввод (`utils/validators`), вызывает `services/db.getSuggestions`, возвращает массив `{ ticker, company_name }`.
- `ticker.js` — GET `/api/ticker/:ticker`. Валидирует тикер, отдаёт результат `getTickerSnapshot`.
- `news.js` — GET `/api/news`. Пытается взять данные из Redis (`news_all`), при промахе читает из БД и обновляет кеш.
- `dividends.js` — GET `/api/dividends?searchQuery=...`. Читает параметр `searchQuery`, достаёт список дивидендов из БД, возвращает формат как до рефакторинга (если нет данных, 404).

Маршруты логируют обращения через `utils/logger` и при необходимости бросают ошибки, которые поймает `middlewares/errorHandler`.

### `middlewares/errorHandler.js`
- Универсальный обработчик. Логирует ошибку, отправляет JSON `{ error }` с корректным статусом (400/404/500).

### `utils/*`
- `logger.js` — общий логгер с префиксами `[server]`, `[db]`, `[route/suggestions]` и т.д.; `debug` включён только в dev.
- `validators.js` — `sanitizeQuery`, `sanitizeTicker`, `sanitizeSearchQuery` (создают ошибки со статусом 400 при некорректном вводе).

## Окружение (`.env`)
```
PORT=3002
DB_HOST=127.0.0.1        # важно не перепутать с портом сервиса
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=fingineer
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000
CACHE_TTL_SEC=3600
NODE_ENV=development
```

## Поток данных
1. **REST**: запрос → `helmet`/`cors`/`readLimiter` → роут → сервис → ответ. Ошибки через `errorHandler`.
2. **News cache**: при GET `/api/news` сначала проверяется Redis (`services/cache`), далее БД (`services/db`), TTL задаётся в `.env`.
3. **Dividends**: `/api/dividends?searchQuery=VTBR` → валидация параметра → SQL → ответ (или 404).

Таким образом, backend2 теперь структурирован аналогично backend1, имеет единые механизмы логирования, CORS, rate-limit, graceful shutdown и готов к переключению фронта с backend1 на backend2 без изменений контрактов.
