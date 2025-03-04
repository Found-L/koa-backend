// src/fileUpload.ts
import Koa from 'koa';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import path from 'path';
import multer from '@koa/multer';

export async function parseFile(filePath: string, mimeType: string): Promise<string> {
    try {
        if (mimeType === 'text/plain') {
            return await fs.readFile(filePath, 'utf-8');
        }

        if (mimeType === 'application/pdf') {
            const data = await fs.readFile(filePath);
            const pdfData = await pdfParse(data);
            return pdfData.text;
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const data = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: data });
            return result.value;
        }

        if (mimeType === 'text/markdown') {
            const markdownContent = await fs.readFile(filePath, 'utf-8');
            const parsed = await unified()
                .use(remarkParse)
                .use(remarkStringify)
                .process(markdownContent);
            return parsed.toString();
        }

        return 'Unsupported file type';
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }
}

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

export function uploadFile(ctx: Koa.Context) {
    const files = ctx.request.files as any; // 假设上传的文件是通过 form-data 传递
    if (files && files.file) {
        const filePath = path.join(__dirname, '..', 'uploads', files.file.name);
        const mimeType = files.file.type;
        return parseFile(filePath, mimeType);
    }
    throw new Error('No file uploaded');
}

export { upload };
