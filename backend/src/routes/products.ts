import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import auth from '../middlewares/auth';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products';

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

// Валидация для создания/обновления товара
const productBodyValidation = celebrate({
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(2).max(30).optional()
      .messages({
        'string.min': 'Минимальная длина поля "title" - 2',
        'string.max': 'Максимальная длина поля "title" - 30',
        'string.empty': 'Поле "title" не может быть пустым',
      }),
    image: Joi.object({
      fileName: Joi.string().required()
        .messages({
          'string.empty': 'Поле "fileName" не может быть пустым',
          'any.required': 'Поле "fileName" является обязательным',
        }),
      originalName: Joi.string().required()
        .messages({
          'string.empty': 'Поле "originalName" не может быть пустым',
          'any.required': 'Поле "originalName" является обязательным',
        }),
    }).optional()
      .messages({
        'any.required': 'Поле "image" является обязательным',
      }),
    category: Joi.string().optional()
      .messages({
        'string.empty': 'Поле "category" не может быть пустым',
        'any.required': 'Поле "category" является обязательным',
      }),
    description: Joi.string().optional().allow('', null),
    price: Joi.number().min(0).allow(null).optional()
      .messages({
        'number.base': 'Поле "price" должно быть числом',
        'number.min': 'Поле "price" должно быть неотрицательным',
      }),
  }),
});

// Валидация для создания товара (все поля обязательны)
const createProductValidation = celebrate({
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(2).max(30).required()
      .messages({
        'string.min': 'Минимальная длина поля "title" - 2',
        'string.max': 'Максимальная длина поля "title" - 30',
        'string.empty': 'Поле "title" не может быть пустым',
        'any.required': 'Поле "title" является обязательным',
      }),
    image: Joi.object({
      fileName: Joi.string().required()
        .messages({
          'string.empty': 'Поле "fileName" не может быть пустым',
          'any.required': 'Поле "fileName" является обязательным',
        }),
      originalName: Joi.string().required()
        .messages({
          'string.empty': 'Поле "originalName" не может быть пустым',
          'any.required': 'Поле "originalName" является обязательным',
        }),
    }).required()
      .messages({
        'any.required': 'Поле "image" является обязательным',
      }),
    category: Joi.string().required()
      .messages({
        'string.empty': 'Поле "category" не может быть пустым',
        'any.required': 'Поле "category" является обязательным',
      }),
    description: Joi.string().optional().allow('', null),
    price: Joi.number().min(0).allow(null)
      .messages({
        'number.base': 'Поле "price" должно быть числом',
        'number.min': 'Поле "price" должно быть неотрицательным',
      }),
  }),
});

// GET /product - получить все товары
router.get('/', getProducts);

// GET /product/:id - получить товар по ID
router.get('/:id', idValidation, getProductById);

// POST /product - создать товар
router.post('/', createProductValidation, createProduct);

// PATCH /product/:id - обновить товар (требуется авторизация)
router.patch('/:id', auth, idValidation, productBodyValidation, updateProduct);

// DELETE /product/:id - удалить товар (требуется авторизация)
router.delete('/:id', auth, idValidation, deleteProduct);

export default router;
