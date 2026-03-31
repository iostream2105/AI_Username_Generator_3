# 仓库协作指南

## Agent 强制约定
- 以中文回复我。
- 执行命令时优先使用 CMD，CMD 用不了时再使用 PowerShell。
- 所有文件编码统一使用 UTF-8。
- 每次产生工作区代码或文档变更后，默认自动提交一个中文 commit，除非我明确说明先不要提交。
- 本应用以移动端（手机端）用户为主；涉及页面、交互、文案、弹窗、分享、输入与返回逻辑时，默认优先按移动端体验设计与验收，再兼容桌面端。

## 项目结构与模块划分
- `src/`：前端源码（React + TypeScript）。
- `src/services/ai.ts`：前端 API 请求层（生成、埋点、收藏、反馈）。
- `src/components/SharePoster.tsx`：分享海报组件。
- `src/utils/share.ts`：海报导出与下载工具。
- `src/utils/clipboard.ts`：复制能力兼容封装。
- `server/index.ts`：后端 API 服务（豆包生成、埋点、收藏、反馈）。
- `server/db.ts`：MySQL 数据访问层（埋点/收藏/反馈）。
- `sql/app_schema.sql`：数据库结构（埋点 + 收藏 + 反馈，合并版）。
- `sql/2026-03-28_add_favorite_context.sql`：收藏上下文字段迁移脚本。
- `sql/analytics_tracking_design.md`：埋点事件定义与指标映射。
- `Dockerfile`、`cloudbaserc.json`：CloudRun 部署相关配置。
- `DEPLOYMENT.md`：部署流程与上线核对清单。

## 开发与构建命令
- `npm install`：安装依赖。
- `npm run dev`：启动前端开发服务（`http://localhost:3000`）。
- `npm run server`：启动后端服务（`http://localhost:3001`）。
- `npm run build`：构建前端产物到 `dist/`。
- `npm run preview`：本地预览构建结果。
- `npm run lint`：TypeScript 类型检查（`tsc --noEmit`）。
- `npm run clean`：清理 `dist/` 目录。

## 编码规范
- 使用 TypeScript 与 React 函数组件。
- 默认 2 空格缩进。
- 组件/类型使用 `PascalCase`，变量与函数使用 `camelCase`。
- 接口入参与出参保持显式类型定义（如 `GenerateParams`、`GeneratedName`）。
- 修改 `src/App.tsx`、`server/index.ts` 时优先小步提交，避免大范围混改。

## 测试与验证
- 当前未配置自动化测试框架。
- 最低质量门槛：`npm run lint` + 手工验证主链路（首页 -> 生成 -> 结果）。
- 后端改动需验证 `/api/generate`、`/api/track`、`/api/favorites`、`/api/feedback` 的成功与异常路径（400/500/503）。
- 移动端联调时需验证：系统返回键按页面层级回退（而非直接退出页面）。
- 前端交互改动默认需要优先验证手机端观感与可操作性，包括首屏高度、弹窗可见区域、输入体验、复制/保存/返回等核心动作。

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
- MySQL 连接需配置：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`（或 `DB_URL`）。
- `VITE_API_BASE_URL` 当前为可选项；生产环境默认通过同域 `/api` 访问后端，仅在跨域直连 CloudRun 时才需要配置。
- 跨域来源由 `FRONTEND_ORIGIN` 控制（后端）。
- 开发环境后端已放行局域网私网来源用于手机调试；生产环境仍按 `FRONTEND_ORIGIN` 严格校验。
- 后台管理端登录必填：`ADMIN_USERNAME`、`ADMIN_PASSWORD`（用于 `/api/admin/login` 账号密码鉴权）。

## 维护说明
- 当前仓库仍存在部分历史中文乱码字符串（mojibake），后续修复时请逐步处理并做界面回归验证。
- 运行时代码已接入埋点、收藏、反馈写库；`analytics_metrics_daily` 仍需离线聚合任务补齐。
- 当代码、配置、接口、部署流程发生变化时，请同步更新 `README.md`、`TECHNICAL.md` 与 `DEPLOYMENT.md`。
