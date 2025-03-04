// import { Context } from 'koa';
// import { parseFile } from '../services/fileUploadService';

// export async function handleFileUpload(ctx: Context) {
//     try {
//         const file = ctx.request.file;  // 获取上传的文件
//         const filePath = file.path;     // 文件存储路径
//         const mimeType = file.mimetype; // 文件类型

//         const parsedContent = await parseFile(filePath, mimeType);
//         ctx.body = { success: true, content: parsedContent };
//     } catch (error) {
//         ctx.status = 500;
//         ctx.body = { success: false, error: error.message };
//     }
// }

// src/controllers/fileUploadController.ts
import Koa from 'koa';
import { parseFile } from '../utils/fileParser';

export const uploadFile = async (ctx: Koa.Context) => {
    const file = ctx.file as any; // `multer` 使用的是 `ctx.file`
    console.log('files:', file);
    if (file) {
        console.log("Uploaded file details:", file);

        const filePath = file.path; // 直接使用 multer 生成的路径
        const mimeType = file.mimetype; // 正确的 MIME 类型

        const fileContent = await parseFile(filePath, mimeType);
        ctx.body = { code: 200, success: true, data: fileContent };
    } else {
        ctx.status = 400;
        ctx.body = { code: 400, success: false, message: 'No file uploaded' };
    }
};

