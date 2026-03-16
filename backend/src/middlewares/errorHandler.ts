import { ErrorRequestHandler } from 'express';
import BadRequestError from '../errors/BadRequestError';
import ConflictError from '../errors/ConflictError';
import InternalServerError from '../errors/InternalServerError';
import UnauthorizedError from '../errors/UnauthorizedError';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Если ошибка уже является экземпляром нашей кастомной ошибки
  if (
    err instanceof BadRequestError
    || err instanceof ConflictError
    || err instanceof InternalServerError
    || err instanceof UnauthorizedError
  ) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Обработка ошибки валидации Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Ошибка валидации данных',
    });
  }

  // Обработка ошибки дублирования уникального поля (E11000)
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Поле уже существует',
    });
  }

  // Обработка ошибки CastError (неправильный формат ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Передан некорректный ID',
    });
  }

  // Для всех остальных ошибок возвращаем 500
  console.error(err);
  res.status(500).json({
    message: 'На сервере произошла ошибка',
  });

  return undefined;
};

export default errorHandler;
