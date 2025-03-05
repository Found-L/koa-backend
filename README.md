# Koa 文件上传与解析后端

## 简介

本项目是基于 Koa 的后端服务，主要用于处理文件上传，并支持解析多种文件格式（如 TXT、PDF、DOCX、CSV、EPUB 等）。通过模块化的架构设计，使代码更加清晰、可维护。

## 项目结构

```bash
src/
├── routes/                 # 路由层，定义 HTTP 接口
│   ├── fileUpload.ts       # 文件上传相关路由
│   ├── auth.ts             # 用户认证相关路由
│   └── users.ts            # 用户管理相关路由
├── controllers/            # 控制器层，处理业务逻辑
│   ├── fileUploadController.ts
│   ├── authController.ts
│   └── userController.ts
├── services/               # 服务层，封装具体功能逻辑
│   ├── fileUploadService.ts # 处理文件解析
│   ├── authService.ts
│   └── userService.ts
├── middlewares/            # 中间件层
│   ├── fileUploadMiddleware.ts # 处理文件上传
│   ├── authMiddleware.ts       # 认证中间件
│   └── logger.ts               # 日志中间件
├── uploads/                # 存放上传的文件
├── server.ts               # 入口文件，初始化 Koa 服务器
└── app.ts                  # 主要的 Koa 应用逻辑
```

## 依赖项

### 核心依赖

- `koa`：Koa 框架
- `koa-router`：路由管理
- `koa-bodyparser`：解析请求体
- `koa-static`：提供静态文件服务
- `@koa/multer`：文件上传处理
- `dotenv`：环境变量管理

### 文件解析相关

- `textract`：解析 文档

文件格式 是否支持
.txt ✅
.docx ✅
.xlsx ✅
.pptx ✅
.csv ✅
.pdf（文本版） ✅
.pdf（扫描版） ✅（需要 Tesseract OCR）
.eml ✅
.html ✅
.xml ❌（推荐 fast-xml-parser）
.epub ❌（推荐 epub-parser）

## 安装与运行

1. 克隆项目

    ```sh
    git clone <https://github.com/your-repo/koa-backend.git>
    cd koa-backend
    ```

2. 安装依赖

    ```sh
    npm install
    ```

3. 运行开发环境

    ```sh
    npm run dev
    ```

    服务默认运行在 <http://localhost:3801>。

## 文件上传示例

上传文件接口：

```http
POST /upload
Content-Type: multipart/form-data
Body: { file: <文件> }
```

## 贡献指南

如果你想贡献代码，请先 Fork 本项目，提交 PR 之前请确保代码通过 ESLint 检查。
