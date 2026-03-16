# WebLarek Backend

Backend для интернет-магазина WebLarek на Node.js + Express + TypeScript + MongoDB.

## Технологии

- **Node.js** — среда выполнения
- **Express** — веб-фреймворк
- **TypeScript** — типизация
- **MongoDB + Mongoose** — база данных
- **JWT** — аутентификация
- **Multer** — загрузка файлов
- **Celebrate/Joi** — валидация данных

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Отредактируйте `.env`:
```env
PORT=3000
DB_ADDRESS=mongodb://127.0.0.1:27017/weblarek
JWT_SECRET=your-super-secret-jwt-key-change-in-production
AUTH_ACCESS_TOKEN_EXPIRY=15m
AUTH_REFRESH_TOKEN_EXPIRY=7d
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшен
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up --build
```

## API Endpoints

### Аутентификация

| Метод | Путь | Описание | Auth | Ошибки |
|-------|------|----------|------|--------|
| POST | `/auth/register` | Регистрация | ❌ | 400, 409, 500 |
| POST | `/auth/login` | Вход | ❌ | 401, 500 |
| GET | `/auth/token` | Обновление токена (через cookie) | ❌ | 401, 404, 500 |
| GET | `/auth/logout` | Выход | ❌ | 400, 404, 500 |
| GET | `/auth/user` | Текущий пользователь | ✅ | 401, 404, 500 |

**Пример запроса на регистрацию:**
```json
{
  "name": "Максим",
  "email": "admin@ya.ru",
  "password": "123456789"
}
```

**Пример запроса на вход:**
```json
{
  "email": "admin@ya.ru",
  "password": "123456789"
}
```

**Пример ответа:**
```json
{
  "user": {
    "email": "admin@ya.ru",
    "name": "Максим"
  },
  "success": true,
  "accessToken": "jwt токен"
}
```

Сервер также устанавливает httpOnly cookie с именем `refreshToken`.

### Товары

| Метод | Путь | Описание | Auth | Ошибки |
|-------|------|----------|------|--------|
| GET | `/product` | Список всех товаров | ❌ | 500 |
| POST | `/product` | Создать товар | ✅ | 400, 401, 409, 500 |
| GET | `/product/:id` | Один товар по ID | ❌ | 400, 404, 500 |
| PATCH | `/product/:id` | Обновить товар | ✅ | 400, 401, 404, 409, 500 |
| DELETE | `/product/:id` | Удалить товар | ✅ | 400, 401, 404, 500 |

### Заказы

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/order` | Создать заказ | ❌ |
| GET | `/order` | Список заказов | ❌ |
| GET | `/order/:id` | Один заказ по ID | ❌ |

### Загрузка файлов

| Метод | Путь | Описание | Auth | Ошибки |
|-------|------|----------|------|--------|
| POST | `/upload` | Загрузить файл | ✅ | 401, 500 |

### Заказы

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/order` | Создать заказ | ❌ |
| GET | `/order` | Список заказов | ❌ |
| GET | `/order/:id` | Один заказ по ID | ❌ |

### Загрузка файлов

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/upload/image` | Загрузить изображение | ❌ |

## Структура проекта

```
backend/
├── src/
│   ├── app.ts                 # Точка входа
│   ├── models/                # Mongoose модели
│   │   ├── Product.ts
│   │   ├── Order.ts
│   │   └── User.ts
│   ├── routes/                # Роуты
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── auth.ts
│   │   └── upload.ts
│   ├── middlewares/           # Middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── upload.ts
│   └── errors/                # Классы ошибок
│       ├── HttpError.ts
│       ├── BadRequestError.ts
│       ├── NotFoundError.ts
│       ├── ConflictError.ts
│       ├── UnauthorizedError.ts
│       ├── InternalServerError.ts
│       └── index.ts
├── public/images/             # Статика (изображения)
├── .env                       # Переменные окружения
├── .env.example
├── package.json
└── tsconfig.json
```

## Модели данных

### Product
```typescript
{
  title: string (unique, 2-30 символов),
  image: {
    fileName: string,
    originalName: string
  },
  category: string,
  description?: string,
  price: number | null
}
```

### Order
```typescript
{
  email: string,
  phone: string,
  address: string,
  payment: 'card' | 'online',
  items: string[], // ID товаров
  total: number,
  status: 'created' | 'paid' | 'cancelled' | 'shipped'
}
```

### User
```typescript
{
  email: string (unique),
  password: string (hashed),
  name: string (2-30 символов),
  role: 'user' | 'admin'
}
```

## Скрипты

- `npm run dev` — запуск в режиме разработки с nodemon
- `npm run build` — компиляция TypeScript
- `npm start` — запуск скомпилированного приложения
- `npm run lint` — проверка ESLint
