import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import BadRequestError from '../errors/BadRequestError';
import InternalServerError from '../errors/InternalServerError';

// POST /upload - загрузка файла во временную папку
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Файл не загружен');
    }

    // Возвращаем информацию о загруженном файле
    res.json({
      fileName: `/temp/${req.file.filename}`,
      originalName: req.file.originalname,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      next(error);
    } else {
      next(new InternalServerError('Ошибка при загрузке файла'));
    }
  }
};

// Функция для перемещения файла из временной папки в постоянную
export const moveFileToImages = (tempFileName: string, originalName: string): string => {
  const imagesDir = path.join(__dirname, '../../public/images');
  const tempFilePath = path.join(__dirname, '../../temp', tempFileName);

  // Создаём директорию для изображений, если её нет
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Генерируем новое имя файла с уникальным префиксом
  const ext = path.extname(originalName);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const newFileName = `${uniqueSuffix}${ext}`;
  const newFilePath = path.join(imagesDir, newFileName);

  // Перемещаем файл
  fs.renameSync(tempFilePath, newFilePath);

  // Возвращаем путь относительно public
  return `/images/${newFileName}`;
};

// Функция для удаления файла
export const deleteFile = (fileName: string): void => {
  if (!fileName) {
    return;
  }

  const filePath = path.join(__dirname, '../../public', fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Функция для удаления временного файла
export const deleteTempFile = (fileName: string): void => {
  if (!fileName) {
    return;
  }

  const filePath = path.join(__dirname, '../../temp', fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
