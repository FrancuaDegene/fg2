FROM ubuntu:latest
LABEL authors="slipatkov"

ENTRYPOINT ["top", "-b"]

# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и устанавливаем зависимости
COPY backend2/package*.json ./
RUN npm install

# Копируем остальные файлы
COPY backend2 ./

# Открываем порт 80 для backend2
EXPOSE 80

# Команда для запуска приложения
CMD ["node", "app.js"]
