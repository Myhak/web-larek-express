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
const dbAddress = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';

const connectWithRetry = async (retries = 5, delay = 2000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connect(dbAddress, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB');
      return true;
    } catch (err) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed:`, err);
      if (attempt < retries) {
        // eslint-disable-next-line no-promise-executor-return, no-await-in-loop
        await new Promise<void>((resolve) => { setTimeout(resolve, delay); });
      }
    }
  }
  console.error('Failed to connect to MongoDB after all retries');
  return false;
};

// Ждём подключения перед запуском сервера
connectWithRetry().then((connected) => {
  if (!connected) {
    console.error('Starting server without database connection');
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

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

export default app;
