## Быстрая инструкция для AI-агента — репозиторий FinGineer (FG2)

Ниже — концентрат знаний, который нужен, чтобы быстро стать продуктивным в этом кодовой базе.

1) Большая картина
- Проект разделён на frontend (`fingineerwebapp`) и два backend-сервиса (`backend1`, `backend2`).
- Frontend — Create React App (порт dev: 3000). Backend-ы — Express (обычно порт 3001 / HTTP 80 в prod). Данные запрашиваются по REST и через Socket.IO.
- Источник правды по свечным данным — MySQL (таблицы типа `moex_marketdata`), кэш — Redis/ioredis. Аггрегацию свечей делает `backend1/DB/getDataFromDatabase.js`.

2) Ключевые файлы и точки входа
- `fingineerwebapp/src/config/api.js` — переменные окружения и точки API (SOCKET_URL, API_BASE_URL, ENDPOINTS).
- `backend1/app.js` и `backend2/app.js` — HTTP/Socket серверы, примеры эндпоинтов: `/api/ticker/:ticker`, `/api/news`, `/api/dividends`, `/api/suggestions/:query`.
- `backend1/DB/getDataFromDatabase.js` — SQL-запрос для агрегации свечей (GROUP_CONCAT + FLOOR(UNIX_TIMESTAMP / interval)). Изменения в формате ответов/кэше — здесь.
- `fingineerwebapp/src/indicators/engine.js` — набор индикаторов (SMA, EMA, RSI). Меняйте здесь чисто-функционально и возвращайте массивы {time, value}.
- `fingineerwebapp/src/components/Results/Chart/` — визуальная часть и реализации типов графиков (см. `CHART_TYPES_SUMMARY.md`).

3) Типовые контракты и форматы
- Socket.IO: клиент шлёт событие `requestChartData` с { ticker, timeframe, interval, selectedDate }.
- Сервер отвечает `initialData` с payload { candles: [ { time, open, high, low, close, volume } ] } или шлёт `error`.
- Ключи кэша: `candles:${ticker}:${interval}:${startDate}:${endDate}` и `news_all`. Соблюдайте ту же строковую схему при изменениях.
- Формат времени в бэкенде: `YYYY-MM-DD HH:MM:SS` (функция `formatDateLocal` в `backend1/app.js`).

4) Важные конвенции и нюансы
- Два бэкенда используют немного разные драйверы: `mysql` (в некоторых файлах) и `mysql2`/пул (в `backend2`). Проверьте какой модуль установлен в package.json перед заменой API.
- Кэширование: код ожидает, что Redis доступен по `REDIS_URL` или `redis://localhost:6379`. В `backend2` используется `ioredis`.
- В `package.json` frontend-а есть ESLint override для воркера: `src/indicators/*.worker.js` (env worker = true). Не ломайте этот паттерн.
- SQL агрегация open/close использует GROUP_CONCAT с ORDER BY SYSTIME; при изменении сортировок учтите производительность и `group_concat_max_len` (в app.js устанавливается сессия).

5) Как запускать (чётко и просто)
- Frontend (dev): перейти в `fingineerwebapp` и `npm install` затем `npm start` (CRA на 3000).
- Backend (dev): в `backend1`/`backend2` `npm install` и `node app.js` (по умолчанию 3001 или 80 — проверьте `process.env.PORT`).
- Для интеграции локально: установите MySQL и Redis либо подставьте рабочие переменные окружения: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, REDIS_URL.

6) Что менять осторожно
- Любые правки в `getDataFromDatabase.js` требуют обновления формирования кэш-ключей и тестового запроса через Socket.IO (см. контракт выше).
- Оптимизации SQL: при изменении запросов проверяйте влияние на LIMIT/отрезание до 3000 свечей (в коде есть slice(-3000)).

7) Примеры запросов (copy-paste для тестов)
- HTTP: GET http://localhost:3001/api/ticker/GAZP — возвращает базовые метаданные о тикере.
- Socket: emit('requestChartData', { ticker: 'GAZP', timeframe: '1mth', interval: '5m', selectedDate: '2025-10-01' }) → ожидаем 'initialData' с candles.

8) Быстрые навигационные подсказки для агента
- Ищите логи на `console.log`/`console.error` — они показывают важные места (Redis, MySQL, Socket connection).
- Перед изменением API убедитесь, что `fingineerwebapp/src/config/api.js` и переменные окружения синхронизированы.
- Индикаторы: правки в `src/indicators/engine.js` должны быть pure-функциями, вход — массив {time, close, ...}, выход — [{time, value}].

Если нужно — внесу правки (обновлю разделы про CI, Dockerfile или добавлю примеры env-файлов). Напишите, что непонятно или какой раздел расширить.
