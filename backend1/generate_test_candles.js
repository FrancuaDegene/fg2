const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const TICKERS = ['SBER', 'GAZP', 'SVCB']; // Добавьте или удалите тикеры по мере необходимости
const SESSIONS = [
    { start: 6 * 60 + 50, end: 9 * 60 + 50 },  // Утренняя сессия 06:50 - 09:50
    { start: 10 * 60 + 0, end: 18 * 60 + 45 }, // Основная сессия 10:00 - 18:45
    { start: 19 * 60 + 0, end: 23 * 60 + 50 }  // Вечерняя сессия 19:00 - 23:50
];

function isHolidayOrWeekend(date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
    }
    const month = date.getMonth();
    const day = date.getDate();
    if (month === 0 && day === 1) {
        return true;
    }
    return false;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function pad(num) {
    return num < 10 ? '0' + num : '' + num;
}

function generateCandlesForDay(ticker, date, initialPriceForDay) {
    const candles = [];
    let basePrice = initialPriceForDay !== undefined ? initialPriceForDay : getRandomFloat(100, 200);

    for (const session of SESSIONS) {
        for (let i = session.start; i <= session.end; i++) {
            const hour = Math.floor(i / 60);
            const minute = i % 60;

            // ЭТА СТРОКА ОСОБЕННО ВАЖНА - УБЕДИСЬ, ЧТО ОНА ИМЕННО ТАКАЯ:
         const systime = `${date} ${pad(hour)}:${pad(minute)}:00`;

            const open = basePrice + getRandomFloat(-0.05, 0.05);
            const close = open + getRandomFloat(-0.03, 0.03);
            const currentHigh = Math.max(open, close) + getRandomFloat(0, 0.01);
            const currentLow = Math.min(open, close) - getRandomFloat(0, 0.01);
            const high = Math.max(open, close, currentHigh);
            const low = Math.min(open, close, currentLow);
            const volume = Math.floor(getRandomFloat(1000, 10000));

            candles.push([
                ticker, 'TQBR', systime,
                open, high, low, close, volume
            ]);

            basePrice = close;
        }
    }
    return candles;
}


async function main() {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) return reject(err);
                console.log('Подключено к базе данных MySQL!');
                resolve();
            });
        });

        // РАСШИРЬТЕ ДИАПАЗОН ДАТ ДЛЯ БОЛЬШЕГО КОЛИЧЕСТВА ДАННЫХ
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31'); // До конца 2023 года

      

        for (const ticker of TICKERS) {
            let lastDayClosePrice = getRandomFloat(100, 200);
            let date = new Date(startDate);
            while (date <= endDate) {
                const dateStr = date.toISOString().slice(0, 10);

                console.log(`[LOG] Обрабатывается дата: ${dateStr}, тикер: ${ticker}`);
                if (isHolidayOrWeekend(date)) {
                    console.log(`[SKIP] ${dateStr} — выходной или праздник. Пропуск генерации.`);
                    date.setDate(date.getDate() + 1);
                    continue;
                }

                const candles = generateCandlesForDay(ticker, dateStr, lastDayClosePrice);

                if (candles.length > 0) {
                    lastDayClosePrice = candles[candles.length - 1][6];
                } else {
                    console.log(`Для ${ticker} за ${dateStr} не сгенерировано торговых свечей, сохраняем предыдущую цену.`);
                }

                console.log(`Сгенегировано свечей: ${candles.length} для ${ticker} за ${dateStr}`);

                await new Promise((resolve, reject) => {
                    if (candles.length === 0) {
                        console.log(`Нет свечей для вставки для ${ticker} за ${dateStr}, пропуск.`);
                        return resolve();
                    }
                    connection.query(
                        `INSERT INTO moex_marketdata 
                        (SECID, BOARDID, SYSTIME, OPEN, HIGH, LOW, CLOSE, VOLTODAY) 
                        VALUES ?`,
                        [candles],
                        (err, result) => {
                            if (err) {
                                console.error(`Ошибка вставки для ${ticker} за ${dateStr}:`, err);
                                reject(err);
                            } else {
                                console.log(`Вставлено свечей: ${result.affectedRows} для ${ticker} за ${dateStr}`);
                                resolve();
                            }
                        }
                    );
                });

                date.setDate(date.getDate() + 1);
            }
        }
    } catch (err) {
        console.error('Ошибка в процессе генерации:', err);
    } finally {
        connection.end();
        console.log('Генерация завершена!');
    }
}

main().catch(err => {
    console.error('Непредвиденная ошибка в main:', err);
});