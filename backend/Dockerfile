FROM node:22-alpine
RUN mkdir /app
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Устанавливаем переменные окружения для Docker
ENV DB_ADDRESS=mongodb://root:example@mongo:27017/weblarek
ENV PORT=3000
ENV ORIGIN_ALLOW=http://localhost:5173
ENV AUTH_REFRESH_TOKEN_EXPIRY=7d
ENV AUTH_ACCESS_TOKEN_EXPIRY=10m
ENV JWT_SECRET=docker-dev-secret-key

CMD ["npm", "run", "dev"]
