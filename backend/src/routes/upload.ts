import { Router } from 'express';
import fileMiddleware from '../middlewares/file';
import auth from '../middlewares/auth';
import { uploadFile } from '../controllers/upload';

const router = Router();

// POST /upload - загрузка файла во временную папку (требуется авторизация)
router.post('/', auth, fileMiddleware, uploadFile);

export default router;
