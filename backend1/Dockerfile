FROM ubuntu:latest
LABEL authors="slipatkov"

ENTRYPOINT ["top", "-b"]

# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и устанавливаем зависимости
COPY backend1/package*.json ./
RUN npm install

# Копируем остальные файлы
COPY backend1 ./

# Открываем порт 3000 для backend1
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "app.js"]
