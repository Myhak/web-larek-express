import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import auth from '../middlewares/auth';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth';

const router = Router();

// Валидация для регистрации
const signupValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Требуется корректный email',
        'any.required': 'Поле "email" является обязательным',
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Минимальная длина поля "password" - 6',
        'any.required': 'Поле "password" является обязательным',
      }),
    name: Joi.string().min(2).max(30).optional()
      .messages({
        'string.min': 'Минимальная длина поля "name" - 2',
        'string.max': 'Максимальная длина поля "name" - 30',
      }),
  }),
});

// Валидация для входа
const signinValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Требуется корректный email',
        'any.required': 'Поле "email" является обязательным',
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Поле "password" является обязательным',
      }),
  }),
});

// POST /auth/register - регистрация
router.post('/register', signupValidation, register);

// POST /auth/login - вход
router.post('/login', signinValidation, login);

// GET /auth/token - обновление токена
router.get('/token', refreshAccessToken);

// GET /auth/logout - выход
router.get('/logout', logout);

// GET /auth/user - текущий пользователь
router.get('/user', auth, getCurrentUser);

export default router;
