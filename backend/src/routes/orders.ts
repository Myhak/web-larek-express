import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { celebrate, Joi, Segments } from 'celebrate';
import { faker } from '@faker-js/faker';
import Product from '../models/Product';
import Order from '../models/Order';
import BadRequestError from '../errors/BadRequestError';
import InternalServerError from '../errors/InternalServerError';

const router = Router();

// Валидация ID в параметрах URL
const idValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required().hex().length(24)
      .messages({
        'string.hex': 'ID должен быть валидным hexadecimal',
        'string.length': 'ID должен быть 24 символов',
        'any.required': 'ID является обязательным',
      }),
  }),
});

// Валидация для создания заказа
const orderBodyValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Требуется корректный email',
        'string.empty': 'Поле "email" не может быть пустым',
        'any.required': 'Поле "email" является обязательным',
      }),
    phone: Joi.string().required()
      .messages({
        'string.empty': 'Поле "phone" не может быть пустым',
        'any.required': 'Поле "phone" является обязательным',
      }),
    address: Joi.string().required()
      .messages({
        'string.empty': 'Поле "address" не может быть пустым',
        'any.required': 'Поле "address" является обязательным',
      }),
    payment: Joi.string().valid('card', 'online').required()
      .messages({
        'any.only': 'Оплата должна быть либо "card", либо "online"',
        'any.required': 'Поле "payment" является обязательным',
      }),
    items: Joi.array().items(Joi.string()).min(1).required()
      .messages({
        'array.base': 'Items должен быть массивом',
        'array.min': 'Items array is required and cannot be empty',
        'any.required': 'Поле "items" является обязательным',
      }),
    total: Joi.number().min(0).required()
      .messages({
        'number.base': 'Total должно быть числом',
        'number.min': 'Total должно быть неотрицательным числом',
        'any.required': 'Поле "total" является обязательным',
      }),
  }),
});

// POST /order - создать заказ
router.post('/', orderBodyValidation, async (req: Request, res: Response, next) => {
  try {
    const {
      payment, email, phone, address, total, items,
    } = req.body;

    // Проверяем, что все переданные ID товаров существуют в базе и доступны для продажи
    const products = await Product.find({ _id: { $in: items } });
    const validProductIds = products
      .filter((product) => product.price !== null)
      .map((p) => p._id.toString());

    if (validProductIds.length !== items.length) {
      throw new BadRequestError('Некоторые товары не найдены или недоступны для продажи');
    }

    // Проверяем, что общая сумма совпадает с ценой товаров
    const calculatedTotal = products.reduce((sum, product) => sum + (product.price || 0), 0);
    if (calculatedTotal !== total) {
      throw new BadRequestError('Общая сумма не совпадает со стоимостью товаров');
    }

    // Генерируем ID заказа
    const orderId = faker.string.uuid();

    // Создаём и сохраняем заказ в БД
    const newOrder = new Order({
      email,
      phone,
      address,
      payment,
      items,
      total,
      status: 'created',
    });

    const savedOrder = await newOrder.save();

    // Возвращаем ID заказа и общую сумму
    res.json({
      id: savedOrder._id.toString(),
      orderId,
      total,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при создании заказа'));
    }
  }
});

// GET /order - получить все заказы
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const orders = await Order.find().populate('items', 'title price');
    res.json({
      items: orders,
      total: orders.length,
    });
  } catch (error) {
    next(new InternalServerError('Ошибка при получении заказов'));
  }
});

// GET /order/:id - получить заказ по ID
router.get('/:id', idValidation, async (req: Request, res: Response, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items', 'title price');

    if (!order) {
      throw new BadRequestError('Заказ не найден');
    }

    res.json(order);
  } catch (error) {
    if (error instanceof BadRequestError) {
      next(error);
    } else if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Передан некорректный ID заказа'));
    } else {
      next(new InternalServerError('Ошибка при получении заказа'));
    }
  }
});

export default router;
