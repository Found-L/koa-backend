// app.ts
import Koa from "koa";
import cors from '@koa/cors';
import bodyParser from "koa-bodyparser";
import dotenv from "dotenv";
import logger from "koa-logger";
import router from "./routes";

dotenv.config();

const app = new Koa();

// 允许跨域
app.use(cors({
  origin: 'http://localhost:5173', // 允许的前端域名
  credentials: true, // 允许携带 Cookie
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的请求方法
  allowHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
}));

app.use(logger());
// 使用中间件
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

console.log("All registered routes:", router.stack.map((i) => i.path));

// 错误处理中间件：统一捕获错误
app.use(async (ctx, next) => {
  try {
      await next();
  } catch (err: any) {
      ctx.status = err.status || 500;
      ctx.body = {
          message: err.message || 'Internal Server Error',
          ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
      };
      ctx.app.emit('error', err, ctx);
  }
});

// 错误日志监听
app.on('error', (err, ctx) => {
  console.error('Server error', err, ctx);
});

export default app;
