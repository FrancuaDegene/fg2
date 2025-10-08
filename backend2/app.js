const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2'); // Обновлено на mysql2 для работы с промисами
const dotenv = require('dotenv');
const cors = require('cors');
const Redis = require('ioredis'); // Подключаем ioredis

const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config();

// Разрешаем CORS для всех запросов
app.use(cors());

// Подключение Bootstrap и Telegram Web App JS
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));

// Создание пула соединений с базой данных (исправляет проблему с закрытием соединения)
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Проверка подключения к базе данных
connection.getConnection((err, conn) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
    process.exit(1);
  }
  console.log('Подключено к базе данных MySQL');
  conn.release(); // Возвращаем соединение в пул
});

// Подключение Redis с использованием ioredis
const redisClient = new Redis();


// Маршрут для получения данных о дивидендах по тикеру
app.get('/api/dividends', async (req, res) => {
    const ticker = req.query.searchQuery; // Получаем тикер

    if (!ticker) {
        return res.status(400).json({ error: 'Не указан тикер для поиска' });
    }

    try {
        // Запрос к базе данных для поиска информации по secid (тикеру)
        const dividendsQuery = `
            SELECT 
                list_section,
                issuer_full_name AS company_name,
                inn,
                DATE_FORMAT(decision_date, '%Y-%m-%d') AS decision_date,
                security_type,
                registration_number AS isin,
                DATE_FORMAT(registration_date, '%Y-%m-%d') AS registration_date,
                dividends_2018,
                median_price_2018,
                yield_2018,
                dividends_2019,
                median_price_2019,
                yield_2019,
                dividends_2020,
                median_price_2020,
                yield_2020,
                dividend_history,
                dividend_policy,
                secid
            FROM 
                moex_dividend_yields
            WHERE 
                UPPER(secid) = UPPER(?);
        `;

        const [dividendsResult] = await connection.promise().query(dividendsQuery, [ticker]);

        if (dividendsResult.length === 0) {
            return res.status(404).json({ error: 'Данные по тикеру не найдены' });
        }

        res.json(dividendsResult); // Отправляем все найденные записи
    } catch (err) {
        console.error('Ошибка при запросе данных:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});



// Пагинация и кеширование для получения новостей
app.get('/api/news', async (req, res) => {
  const cacheKey = `news_all`;  // Ключ для кэширования всех новостей

  try {
    // Проверяем кеш
    const cachedNews = await redisClient.get(cacheKey);

    if (cachedNews) {
      // Если данные есть в кеше
      console.log('Данные из кеша');
      return res.json(JSON.parse(cachedNews));
    } else {
      // Если данных нет в кеше, запрашиваем их из базы данных
      connection.query(
        'SELECT title, content, created_at FROM blog_posts ORDER BY created_at DESC',  // Добавлен столбец created_at
        (error, results) => {
          if (error) {
            console.error('Ошибка при выполнении запроса:', error);
            return res.status(500).json({ error: 'Ошибка сервера' });
          }

          // Сохраняем результат в кеш на 5 минут
          redisClient.setex(cacheKey, 300, JSON.stringify(results));

          console.log('Данные из базы данных');
          res.json(results);
        }
      );
    }
  } catch (err) {
    console.error('Ошибка при доступе к Redis:', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для получения информации о тикере
app.get('/api/ticker/:ticker', (req, res) => {
  const ticker = req.params.ticker.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // Защита от ненадежных символов
  connection.query(
    'SELECT * FROM moex_securities WHERE SECID = ? AND BOARDID = "TQBR"',
    [ticker],
    (error1, securityResults) => {
      if (error1) {
        console.error('Ошибка при выполнении запроса к базе данных:', error1);
        res.status(500).json({ error: 'Ошибка сервера' });
        return;
      }

      if (securityResults.length === 0) {
        res.status(404).json({ error: 'Тикер не найден' });
        return;
      }

      const securityData = securityResults[0];
      connection.query(
        'SELECT * FROM moex_marketdata WHERE SECID = ? AND BOARDID = "TQBR" ORDER BY SYSTIME DESC, TIME DESC LIMIT 1',
        [ticker],
        (error2, marketDataResults) => {
          if (error2) {
            console.error('Ошибка при выполнении запроса к базе данных:', error2);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
          }

          const marketData = marketDataResults[0] || {};

          connection.query(
            'SELECT description FROM tgbot_ticker_list WHERE name = ? ORDER BY description ASC',
            [ticker],
            (error3, descriptionResults) => {
              if (error3) {
                console.error('Ошибка при выполнении запроса к базе данных:', error3);
                res.status(500).json({ error: 'Ошибка сервера' });
                return;
              }

              const descriptionData = descriptionResults[0] || {};

              const responseData = {
                companyName: securityData.SECNAME || 'N/A',
                ticker: securityData.SECID || 'N/A',
                date: marketData.SYSTIME || 'N/A',
                time: marketData.TIME || 'N/A',
                closingPrice: marketData.LAST || 'N/A',
                openingPrice: marketData.OPEN || 'N/A',
                minPrice: marketData.LOW || 'N/A',
                maxPrice: marketData.HIGH || 'N/A',
                description: descriptionData.description || 'Описание недоступно',
                sector: securityData.SECTORID || '—',
                exchange: securityData.BOARDID || '—',
                dividendYield: '—' // пока заглушка
              };
              
              

              res.json(responseData);
            }
          );
        }
      );
    }
  );
});

// Маршрут для получения подсказок
app.get('/api/suggestions/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase(); // Очистка и приведение к нижнему регистру

  // SQL запрос для поиска по тикеру и полному имени компании из таблицы ticker_mapping
  const sqlQuery = `
    SELECT DISTINCT ticker_symbol, full_name
    FROM ticker_mapping
    WHERE LOWER(ticker_symbol) LIKE ? OR LOWER(full_name) LIKE ?
  `;

  // Выполнение запроса
  connection.query(sqlQuery, [`%${query}%`, `%${query}%`], (error, results) => {
    if (error) {
      console.error('Ошибка при выполнении запроса подсказок:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
      return;
    }

    // Формирование списка подсказок: тикер или полное имя компании
    const suggestions = results.map(result => {
      return {
        ticker: result.ticker_symbol,
        company_name: result.full_name
      };
    });

    res.json(suggestions);
  });
});
// Маршрут для загрузки файла socket.io.js
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(path.join(__dirname, '/node_modules/socket.io/client-dist/socket.io.js'));
});

// Создание HTTP-сервера
const httpServer = http.createServer(app);

// Запуск HTTP-сервера
httpServer.listen(80, () => {
  console.log('Сервер запущен на порту 80 (HTTP)');
});

// Корректное закрытие соединений при завершении приложения
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT. Закрываем соединения...');
  connection.end(() => {
    console.log('Пул соединений MySQL закрыт.');
    redisClient.disconnect();
    console.log('Соединение с Redis закрыто.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM. Закрываем соединения...');
  connection.end(() => {
    console.log('Пул соединений MySQL закрыт.');
    redisClient.disconnect();
    console.log('Соединение с Redis закрыто.');
    process.exit(0);
  });
});

