import multer from 'multer';
import path from 'path';
import BadRequestError from '../errors/BadRequestError';

// Настраиваем хранилище
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../public/images'));
  },
  filename: (_req, file, cb) => {
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

// Создаём экземпляр multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB лимит
  },
  fileFilter,
});

// Middleware для обработки загрузки изображения
export const uploadImage = upload.single('image');
