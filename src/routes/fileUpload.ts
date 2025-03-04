// src/routes/fileUploadRouter.ts
import Router from 'koa-router';
import { upload } from '../middlewares/fileUploadMiddleware';
import { uploadFile } from '../controllers/fileUploadController';

const router = new Router();

// 上传文件路由
router.post('/', upload.single('file'), uploadFile);

export default router;
