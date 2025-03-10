// src/middlewares/fileUploadMiddleware.ts

import multer from '@koa/multer';

// 允许的文件类型
const allowedMimeTypes = [
    'text/plain', // TXT
    'text/markdown', // MARKDOWN, MD
    // 'application/octet-stream', // 二进制流格式  (一些特殊格式支持上传)  例如markdown 格式不识别
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/pdf', // PDF
    'text/html', // HTML
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC
    // 'application/vnd.ms-powerpoint', // PPT
    // 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    // 'application/epub+zip', // EPUB
    // 'message/rfc822', // EML
    // 'application/vnd.ms-outlook', // MSG
    // 'text/csv', // CSV
    'application/xml', // XML
    'text/xml', // XML
    // 'application/zip', // ZIP (一些压缩格式支持上传)
    'application/json', // JSON
];

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 文件保存的目录
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${Buffer.from(file.originalname, "latin1").toString('utf-8')}`); // 设置文件名
    }
});

// 过滤文件类型
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {

    // 手动修正 Markdown 文件的 MIME 类型
    if (file.originalname.endsWith('.md') && file.mimetype === 'application/octet-stream') {
        file.mimetype = 'text/markdown';
    }

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


