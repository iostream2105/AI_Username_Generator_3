# AI Username Generator

一个前后端分离的中文 AI 网名生成器：输入关键词、寓意和风格，返回 3 个有解释的昵称候选。

## 线上地址

- 前端（CloudBase 静态托管）  
  https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/
- 后端 API（CloudBase CloudRun）  
  https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com
- API 路径  
  `POST /api/generate`

## 项目结构

- `src/`：React + Vite 前端
- `src/services/ai.ts`：前端请求 API（支持 `VITE_API_BASE_URL`）
- `server/index.ts`：本地 Express 后端入口
- `cloudfunctions/generateApi/`：CloudBase HTTP 云函数版本（备用）
- `Dockerfile`：CloudRun 容器部署配置
- `dist/`：前端构建产物

## 本地开发

前置条件：Node.js 18+

1. 安装依赖
   `npm install`
2. 配置环境变量（`.env.local`）
   - `DOUBAO_API_KEY=...`
   - 可选：`FRONTEND_ORIGIN=http://localhost:3000`
3. 启动前端
   `npm run dev`
4. 启动后端
   `npm run server`

常用命令：
- `npm run lint`：TypeScript 类型检查
- `npm run build`：构建前端
- `npm run preview`：预览构建结果

## CloudBase 生产部署说明

当前生产环境：`ai-username-env-2glikc1y1cb803fb`

- CloudRun 服务名：`ai-username-api-v2`
- 推荐配置：`Cpu=0.5`、`Mem=1`、`MinNum=1`、`MaxNum=2`
- CloudRun 环境变量：
  - `DOUBAO_API_KEY`
  - `FRONTEND_ORIGIN=*`
  - `NODE_ENV=production`

前端发布时请注入：
`VITE_API_BASE_URL=https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com`

## 运维建议

- 如果接口异常，先检查 CloudRun 是否有在线版本与健康实例。
- 若需回滚，优先回滚 CloudRun 到上一可用版本，再重新构建并上传前端。
- 避免将 API Key 提交到仓库，统一使用环境变量管理。
