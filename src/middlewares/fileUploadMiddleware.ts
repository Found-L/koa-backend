// src/middlewares/fileUploadMiddleware.ts

import multer from '@koa/multer';

// 允许的文件类型
const allowedMimeTypes = [
    'text/plain', // TXT
    'text/markdown', // MARKDOWN, MD
    // 'application/vnd.ms-excel', // XLS
    // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/pdf', // PDF
    // 'text/html', // HTML
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC
    // 'application/vnd.ms-powerpoint', // PPT
    // 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    // 'application/xml', // XML
    // 'application/epub+zip', // EPUB
    // 'message/rfc822', // EML
    // 'application/vnd.ms-outlook', // MSG
    // 'text/csv', // CSV
    // 'application/xml', // XML
    // 'application/zip', // ZIP (一些压缩格式支持上传)
    'application/json', // JSON
];

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 文件保存的目录
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`); // 设置文件名
    }
});

// 过滤文件类型
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // 允许上传
    } else {
        cb(new Error('Unsupported file type'), false); // 拒绝上传
    }
};

// 文件大小限制（单位：字节）
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB 限制
});

export { upload };


