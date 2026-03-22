import multer from 'multer';
import path from 'path';
import fs from 'fs';
import BadRequestError from '../errors/BadRequestError';

// Создаём директорию для временных файлов, если её нет
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Настраиваем хранилище для временных файлов
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Фильтр для проверки типа файлов
const fileFilter = (_req: any, file: any, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
    return;
  }

  cb(new BadRequestError('Разрешены только изображения (jpeg, jpg, png, gif, webp, svg)'));
};

// Создаём экземпляр multer с лимитами
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB лимит
  },
  fileFilter,
});

// Middleware для обработки загрузки файла
export default upload.single('file');
