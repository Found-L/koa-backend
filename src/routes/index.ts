// src/routes/index.ts
import Router from 'koa-router';
import fileUploadRouter from './fileUpload';

const router = new Router();

// 定义一个简单的路由
router.get("/", async (ctx) => {
  ctx.body = { message: "Hello, Koa!" };
});

router.get("/test", async (ctx) => {
  ctx.body = { success: true };
});

// 合并各个子路由模块
router.use('/upload', fileUploadRouter.routes(), fileUploadRouter.allowedMethods());

// 导出主路由
export default router;
