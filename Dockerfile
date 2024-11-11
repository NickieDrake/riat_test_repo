FROM node:14

# Создаем рабочую директорию
# WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]