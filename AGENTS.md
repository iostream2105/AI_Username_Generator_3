# 仓库协作指南

## Agent 强制约定
- 以中文回复我。
- 执行命令时优先使用 CMD，CMD 用不了时再使用 PowerShell。
- 所有文件编码统一使用 UTF-8。

## 项目结构与模块划分
- `src/`：前端源码（React + TypeScript）。
- `src/services/ai.ts`：前端调用 `/api/generate` 的请求层。
- `server/index.ts`：后端 API 服务，负责调用豆包模型。
- `cloudfunctions/generateApi/`：可选云函数后端（备用方案）。
- `sql/`：PRD 第 16 节埋点数据库设计与事件定义。
- `Dockerfile`、`cloudbaserc.json`：CloudRun 部署相关配置。

## 开发与构建命令
- `npm install`：安装依赖。
- `npm run dev`：启动前端开发服务（`http://localhost:3000`）。
- `npm run server`：启动后端服务（`http://localhost:3001`）。
- `npm run build`：构建前端产物到 `dist/`。
- `npm run preview`：本地预览构建结果。
- `npm run lint`：TypeScript 类型检查（`tsc --noEmit`）。

## 编码规范
- 使用 TypeScript 与 React 函数组件。
- 默认 2 空格缩进。
- 组件/类型使用 `PascalCase`，变量与函数使用 `camelCase`。
- 接口入参与出参保持显式类型定义（如 `GenerateParams`、`GeneratedName`）。
- 修改 `src/App.tsx`、`server/index.ts` 时优先小步提交，避免大范围混改。

## 测试与验证
- 当前未配置自动化测试框架。
- 最低质量门槛：`npm run lint` + 手工验证主链路（首页 -> 生成 -> 结果）。
- 后端改动需验证 `/api/generate` 的成功与异常路径（400/500）。

## 提交与 PR 要求
- 提交消息用中文描述。
- 提交信息建议简洁、动作导向，例如：`修复：处理空关键词请求`。
- 一个提交尽量只做一类改动，保证可回滚。
- PR 需包含：
  - 变更目的与范围
  - 本地验证步骤与结果
  - 前端交互改动的截图或录屏

## 安全与配置
- 密钥只放在 `.env.local`，不要提交到仓库。
- 必填密钥：`DOUBAO_API_KEY`。
- 生产环境前端需配置 `VITE_API_BASE_URL` 指向 CloudRun。
- 跨域来源由 `FRONTEND_ORIGIN` 控制（后端）。

## 维护说明
- 当前仓库仍存在部分历史中文乱码字符串（mojibake），后续修复时请逐步处理并做界面回归验证。
- `sql/` 中已提供埋点表结构，但运行时代码尚未完整接入埋点写库流程。
