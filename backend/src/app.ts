import express, { Request, Response } from 'express';
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

// Подключение к MongoDB
const dbAddress = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';
mongoose.connect(dbAddress)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

// Middleware
app.use(cors({
  origin: process.env.ORIGIN_ALLOW || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
