import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';

dotenv.config();

const app = express();

// Подключение к MongoDB с таймаутом и повторными попытками
// DB_ADDRESS берётся из .env файла (для Docker: mongodb://root:example@mongo:27017/weblarek)
const dbAddress = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';

console.log('Connecting to MongoDB:', dbAddress);

const connectWithRetry = async (retries = 15, delay = 2000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connect(dbAddress, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (err) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, (err as Error).message);
      if (attempt < retries) {
        // eslint-disable-next-line no-promise-executor-return, no-await-in-loop
        await new Promise<void>((resolve) => { setTimeout(resolve, delay); });
      }
    }
  }
  console.error('Failed to connect to MongoDB after all retries');
  return false;
};

// Middleware
app.use(cors({
  origin: process.env.ORIGIN_ALLOW || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({
  strict: false,
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Обработчик ошибок синтаксического анализа JSON
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Невалидный JSON' });
  }
  next(err);
  return undefined;
});

// Роуты
app.use('/product', productsRouter);
app.use('/order', ordersRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Обработка 404 ошибки
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Запрашиваемый ресурс не найден' });
});

// Подключение middleware для обработки ошибок
app.use(errorHandler);

// Запускаем сервер СРАЗУ
const PORT: number = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MongoDB connection status: ${mongoose.connection.readyState}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
});

// Подключаемся к MongoDB в фоновом режиме
connectWithRetry();

export default app;
