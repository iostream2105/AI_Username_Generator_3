# AI 网名生成器

这是一个前后端分离的 AI 网名生成项目。用户输入关键词，并可选寓意与风格偏好，系统返回 3 个候选网名及解释。

## 当前线上部署
- 前端（CloudBase 静态托管）：
  https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/
- 后端（CloudRun）：
  https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com

## 项目结构
- `src/`：React + Vite 前端
- `src/AdminApp.tsx`：后台管理端页面（`/admin`）
- `src/admin/`：后台管理端 API 封装与类型定义
- `src/services/ai.ts`：前端 API 请求与埋点上报封装
- `server/index.ts`：Express 后端服务（生成接口、收藏接口、埋点接口、反馈接口）
- `server/db.ts`：MySQL 连接与数据访问层（收藏 + 埋点 + 用户反馈）
- `cloudfunctions/generateApi/`：云函数备选实现
- `sql/app_schema.sql`：数据库结构（埋点 + 收藏 + 反馈，合并版）
- `sql/analytics_tracking_design.md`：埋点事件字典与指标映射
- `Dockerfile`：CloudRun 容器构建配置

## 后台管理端
- 前端入口：`/admin`
- 默认能力：总览看板、生成记录、事件日志、收藏、反馈、CSV 导出
- 本地与线上均可访问后台页面（页面路由不再受环境开关控制）
- 后台接口采用账号密码登录鉴权（`POST /api/admin/login` + Bearer Token）
- 详情文档见：`ADMIN_DASHBOARD.md`

## 本地开发
前置条件：Node.js 18+

1. 安装依赖
```bash
npm install
```

2. 配置 `.env.local`
```bash
DOUBAO_API_KEY=你的豆包密钥
FRONTEND_ORIGIN=http://localhost:3000

# MySQL（收藏与埋点写库）
DB_HOST=你的MySQL地址
DB_PORT=3306
DB_USER=你的用户名
DB_PASSWORD=你的密码
DB_NAME=ai-username-env-2glikc1y1cb803fb
```

3. 启动后端
```bash
npm run server
```

4. 启动前端
```bash
npm run dev
```

## API 概览
- `POST /api/generate`：生成网名（并写入生成相关埋点）
- `POST /api/track`：通用埋点事件上报
- `POST /api/feedback`：用户反馈（满意度/建议）入库
- `GET /api/favorites?userKey=...`：查询收藏
- `POST /api/favorites`：新增收藏
- `DELETE /api/favorites`：取消收藏

后台管理端 API（只读）：
- `POST /api/admin/login`
- `GET /api/admin/overview`
- `GET /api/admin/generations`
- `GET /api/admin/events`
- `GET /api/admin/favorites`
- `GET /api/admin/feedback`
- `GET /api/admin/export`

说明：
- `POST /api/admin/login` 使用账号密码换取 token。
- 其余 `/api/admin/*` 接口需要携带请求头：`Authorization: Bearer <token>`。

## 生成策略说明（当前实现）
- 模型：`doubao-seed-1-8-251228`（结构化输出）。
- 后端会使用 `json_schema` 约束模型返回结构，优先解析 `{"items":[...]}`。
- 若首次解析失败，会触发一次更严格提示词的二次重试（`parse_retry=true`）。
- 已移除本地兜底结果；若重试后仍解析失败，接口返回 `500`，前端提示“生成失败，请稍后重试”。
- 前端加载态采用分阶段文案：`正在理解关键词 -> 正在创作 -> 正在润色`。

## 关键接口示例
`POST /api/generate` 请求体：
```json
{
  "keywords": "月亮、海",
  "meaning": "自由",
  "style": "文艺",
  "userKey": "u_xxx",
  "sessionId": "s_xxx",
  "generationId": "gen_xxx"
}
```

`POST /api/generate` 响应体：
```json
{
  "generation_id": "gen_xxx",
  "items": [
    {
      "name": "示例网名",
      "meaning_title": "寓意标题",
      "meaning_desc": "一句话解释",
      "style_tags": ["文艺", "清冷"]
    }
  ]
}
```

## 构建与检查
```bash
npm run lint
npm run build
npm run build:prod
npm run preview
```

说明：
- `npm run build:prod`：用于生产构建，并注入线上 `VITE_API_BASE_URL`。

## 手机局域网调试
- 前端已默认支持局域网访问（`vite --host=0.0.0.0`）。
- 后端在开发环境会自动放行私网来源（`192.168.x.x` / `10.x.x.x` / `172.16-31.x.x`）的 CORS，便于手机同网段联调。
- 生产环境仍需通过 `FRONTEND_ORIGIN` 白名单精确控制来源。

## CloudBase 说明
- 环境 ID：`ai-username-env-2glikc1y1cb803fb`
- 主服务：`ai-username-api-v2`
- 生产构建前，请将 `VITE_API_BASE_URL` 设置为 CloudRun 域名
- 后台接口始终支持本地与线上访问，不再区分 `ADMIN_LOCAL_ONLY` / `ADMIN_REQUIRE_AUTH` / `VITE_ENABLE_ADMIN`（这些开关已下线）。
- 后台登录仅依赖：
  - `ADMIN_USERNAME=你的后台账号`
  - `ADMIN_PASSWORD=你的后台密码`

## 文档索引
- 协作规范：`AGENTS.md`
- 技术文档：`TECHNICAL.md`
- 后台文档：`ADMIN_DASHBOARD.md`
- PRD：`PRD.md`
- 数据库结构：`sql/app_schema.sql`
