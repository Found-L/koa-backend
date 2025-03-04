// src/utils/uploadConfig.ts
import multer from '@koa/multer';
import path from 'path';

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 文件保存的目录
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`); // 设置文件名
    }
});

const upload = multer({ storage });

export default upload;
