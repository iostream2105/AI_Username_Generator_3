# AI 网名生成器

这是一个前后端分离的 AI 网名生成项目。用户输入关键词，并可选寓意与风格偏好，系统返回 3 个候选网名及解释。

## 当前线上部署
- 前端（CloudBase 静态托管）：  
  https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/
- 后端（CloudRun）：  
  https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com
- 接口路径：`POST /api/generate`

## 项目结构
- `src/`：React + Vite 前端
- `src/services/ai.ts`：前端 API 请求封装
- `server/index.ts`：Express 后端服务
- `cloudfunctions/generateApi/`：云函数备选实现
- `sql/`：埋点数据库设计与事件文档
- `Dockerfile`：CloudRun 容器构建配置

## 本地开发
前置条件：Node.js 18+

1. 安装依赖
```bash
npm install
```
2. 配置 `.env.local`
```bash
DOUBAO_API_KEY=你的密钥
FRONTEND_ORIGIN=http://localhost:3000
```
3. 启动后端
```bash
npm run server
```
4. 启动前端
```bash
npm run dev
```

## 构建与检查
```bash
npm run lint
npm run build
npm run preview
```

## CloudBase 说明
- 环境 ID：`ai-username-env-2glikc1y1cb803fb`
- 主服务：`ai-username-api-v2`
- 生产构建前，请将 `VITE_API_BASE_URL` 设置为 CloudRun 域名。

## 文档索引
- 协作规范：`AGENTS.md`
- 技术文档：`TECHNICAL.md`
- PRD 埋点表结构：`sql/analytics_schema.sql`