import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import type { CookieOptions } from 'express';
import User from '../models/User';
import BadRequestError from '../errors/BadRequestError';
import ConflictError from '../errors/ConflictError';
import UnauthorizedError from '../errors/UnauthorizedError';
import NotFoundError from '../errors/NotFoundError';
import InternalServerError from '../errors/InternalServerError';

const { JWT_SECRET, AUTH_REFRESH_TOKEN_EXPIRY, AUTH_ACCESS_TOKEN_EXPIRY } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

// Время жизни токенов
const accessTokenExpiry: string = AUTH_ACCESS_TOKEN_EXPIRY || '10m';
const refreshTokenExpiry = AUTH_REFRESH_TOKEN_EXPIRY || '7d';

// Парсим время жизни refresh токена для куки (в миллисекундах)
const parseExpiryToMs = (expiry: string): number => {
  // @ts-ignore - ms имеет проблемы с типами
  const result = ms(expiry);
  return typeof result === 'number' ? result : 7 * 24 * 60 * 60 * 1000; // 7 days default
};

// Опции для httpOnly куки
const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: parseExpiryToMs(refreshTokenExpiry),
  path: '/',
});

// Генерация токенов
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { _id: userId },
    JWT_SECRET,
    { expiresIn: accessTokenExpiry } as SignOptions,
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    JWT_SECRET,
    { expiresIn: refreshTokenExpiry } as SignOptions,
  );

  return { accessToken, refreshToken };
};

// Отправка куки с refresh токеном
const sendRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

// Очистка куки с refresh токеном
const clearRefreshTokenCookie = (res: Response) => {
  res.cookie('refreshToken', '', {
    ...getRefreshTokenCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
};

// POST /auth/register - регистрация пользователя
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Пользователь с таким email уже существует');
    }

    // Создаём нового пользователя
    const user = await User.create({ email, password, name });

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Сохраняем refresh токен в базе
    user.tokens = [{ token: refreshToken }];
    await user.save();

    // Отправляем refresh токен в куку
    sendRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      next(error);
    } else if (error instanceof BadRequestError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при регистрации пользователя'));
    }
  }
};

// POST /auth/login - аутентификация пользователя
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя (с полем password)
    const user = await User.findOne({ email }).select('+password').select('+tokens');

    if (!user) {
      throw new UnauthorizedError('Неправильные логин или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Неправильные логин или пароль');
    }

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Сохраняем refresh токен в базе
    user.tokens = [{ token: refreshToken }];
    await user.save();

    // Отправляем refresh токен в куку
    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при входе'));
    }
  }
};

// GET /auth/token - обновление токенов
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh токен не предоставлен');
    }

    // Проверяем refresh токен
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Невалидный refresh токен');
    }

    // Находим пользователя и проверяем наличие токена в базе
    const user = await User.findById(payload._id).select('+tokens');

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    const tokenExists = user.tokens?.some((t) => t.token === refreshToken);
    if (!tokenExists) {
      throw new UnauthorizedError('Refresh токен не найден в базе');
    }

    // Генерируем новые токены
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Обновляем refresh токен в базе
    user.tokens = [{ token: newRefreshToken }];
    await user.save();

    // Отправляем новый refresh токен в куку
    sendRefreshTokenCookie(res, newRefreshToken);

    res.json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при обновлении токена'));
    }
  }
};

// GET /auth/logout - выход пользователя
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new BadRequestError('Refresh токен не предоставлен');
    }

    // Проверяем токен и получаем userId
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;
    } catch (error) {
      // Если токен невалидный, всё равно очищаем куку
      clearRefreshTokenCookie(res);
      res.json({ success: true });
      return;
    }

    // Проверяем валидность _id
    if (!payload._id || !payload._id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Невалидный ID пользователя');
    }

    // Находим пользователя
    const user = await User.findById(payload._id).select('+tokens');

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    // Удаляем refresh токен из базы
    user.tokens = user.tokens?.filter((t) => t.token !== refreshToken) || [];
    await user.save();

    // Очищаем куку
    clearRefreshTokenCookie(res);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при выходе'));
    }
  }
};

// GET /auth/user - получение текущего пользователя
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;

    if (!userId) {
      throw new UnauthorizedError('Необходима авторизация');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    res.json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при получении данных пользователя'));
    }
  }
};
