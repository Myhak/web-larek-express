import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import Product from '../models/Product';
import BadRequestError from '../errors/BadRequestError';
import NotFoundError from '../errors/NotFoundError';
import ConflictError from '../errors/ConflictError';
import InternalServerError from '../errors/InternalServerError';
import { moveFileToImages, deleteFile } from './upload';

// GET /product - получить все товары
export const getProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find();
    res.json({
      items: products,
      total: products.length,
    });
  } catch (error) {
    next(new InternalServerError('Ошибка при получении товаров'));
  }
};

// GET /product/:id - получить товар по ID
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError('Товар не найден');
    }

    res.json(product);
  } catch (error) {
    if (error instanceof NotFoundError) {
      next(error);
    } else if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Передан некорректный ID товара'));
    } else {
      next(new InternalServerError('Ошибка при получении товара'));
    }
  }
};

// POST /product - создать товар
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      description, image, title, category, price,
    } = req.body;

    // Если изображение загружалось через /upload, перемещаем его в постоянную папку
    let finalImage = image;
    if (image?.fileName && image.fileName.startsWith('/temp/')) {
      const tempFileName = path.basename(image.fileName);
      const newFileName = moveFileToImages(tempFileName, image.originalName);
      finalImage = {
        fileName: newFileName,
        originalName: image.originalName,
      };
    }

    const newProduct = new Product({
      title,
      image: finalImage,
      category,
      description,
      price,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Ошибка валидации данных при создании товара'));
    } else if ((error as any).code === 11000) {
      next(new ConflictError('Товар с таким названием уже существует'));
    } else {
      next(new InternalServerError('Ошибка при создании товара'));
    }
  }
};

// PATCH /product/:id - обновить товар
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      title, image, category, description, price,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      throw new NotFoundError('Нет товара по заданному id');
    }

    // Проверяем, не занято ли новое название другим товаром
    if (title && title !== product.title) {
      const existingProduct = await Product.findOne({ title, _id: { $ne: id } });
      if (existingProduct) {
        throw new ConflictError('Товар с таким заголовком уже существует');
      }
    }

    // Если изображение загружалось через /upload, перемещаем его в постоянную папку
    let finalImage = product.image;
    if (image?.fileName && image.fileName.startsWith('/temp/')) {
      // Удаляем старое изображение
      if (product.image?.fileName) {
        deleteFile(product.image.fileName);
      }

      const tempFileName = path.basename(image.fileName);
      const newFileName = moveFileToImages(tempFileName, image.originalName);
      finalImage = {
        fileName: newFileName,
        originalName: image.originalName,
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        title: title || product.title,
        image: finalImage,
        category: category || product.category,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? price : product.price,
      },
      { new: true, runValidators: true },
    );

    res.json(updatedProduct);
  } catch (error) {
    if (
      error instanceof BadRequestError
      || error instanceof NotFoundError
      || error instanceof ConflictError
    ) {
      next(error);
    } else if (error instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Ошибка валидации данных при обновлении товара'));
    } else if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Передан некорректный ID товара'));
    } else {
      next(new InternalServerError('Ошибка при обновлении товара'));
    }
  }
};

// DELETE /product/:id - удалить товар
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      throw new NotFoundError('Нет товара по заданному id');
    }

    res.json(product);
  } catch (error) {
    if (error instanceof NotFoundError) {
      next(error);
    } else if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Передан некорректный ID товара'));
    } else {
      next(new InternalServerError('Ошибка при удалении товара'));
    }
  }
};
