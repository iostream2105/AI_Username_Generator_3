# AI 网名生成器

这是一个前后端分离的 AI 命名生成项目。用户输入关键词，并可选期望寓意，可按模式生成中文网名、英文名字或中英混合名字（每次返回 3 个候选及解释）。

补充说明：当前产品定位以移动端（手机端）用户为主，页面交互、分享链路、复制/收藏/保存海报等核心体验均优先按手机浏览器场景设计，再兼容桌面端。

## 当前已落地能力
- 首页支持输入 `1-2` 个关键词，并可选“期望寓意”后生成 3 个结果。
- 支持 `cn / en / mix` 三种模式，后端会严格校验每个结果与当前模式一致。
- 结果支持复制、收藏、保存 PNG 海报。
- 收藏记录会保存收藏当时的输入上下文：关键词、寓意方向、生成模式。
- 收藏页再次打开分享海报时，会优先展示该条收藏对应的真实输入，而不是通用占位文案。
- 移动端切后台后，应用会尽量恢复结果页、收藏页和分享海报弹窗状态。
- 当前交互验收以手机端优先：优先保证小屏浏览器中的输入、生成、复制、收藏、保存海报与页面回退体验。
- 后台管理端支持总览看板、生成记录、事件日志、收藏记录、反馈列表和 CSV 导出。

## 当前线上部署
- 主域名（前后端同域）：
  https://mingyouyi.cn/
  - 前端静态资源：`/`
  - 后端 API：`/api/*`（HTTP 访问服务路由到 CloudRun）
- 前端默认域名（CloudBase 静态托管）：
  https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/
- 后端默认域名（CloudRun）：
  https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com

## 项目结构
- `src/`：React + Vite 前端
- `src/AdminApp.tsx`：后台管理端页面（`/admin`）
- `src/admin/`：后台管理端 API 封装与类型定义
- `src/services/ai.ts`：前端 API 请求与埋点上报封装
- `src/components/SharePoster.tsx`：分享海报组件（预览与导出共用）
- `src/utils/share.ts`：海报导出与下载工具
- `src/utils/clipboard.ts`：复制能力封装（含移动端降级方案）
- `server/index.ts`：Express 后端服务（生成接口、收藏接口、埋点接口、反馈接口）
- `server/db.ts`：MySQL 连接与数据访问层（收藏 + 埋点 + 用户反馈）
- `sql/app_schema.sql`：数据库结构（埋点 + 收藏 + 反馈，合并版）
- `sql/2026-03-28_add_favorite_context.sql`：收藏上下文字段增量迁移脚本
- `sql/analytics_tracking_design.md`：埋点事件字典与指标映射
- `Dockerfile`：CloudRun 容器构建配置
- `DEPLOYMENT.md`：部署流程文档

说明：`cloudfunctions/generateApi/` 备用云函数方案已下线，当前仅保留 CloudRun 后端。

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

# 后台管理端登录
ADMIN_USERNAME=你的后台账号
ADMIN_PASSWORD=你的后台密码
ADMIN_TOKEN_EXPIRE_HOURS=12

# MySQL（收藏与埋点写库）
DB_HOST=你的MySQL地址
DB_PORT=3306
DB_USER=你的用户名
DB_PASSWORD=你的密码
DB_NAME=你的数据库名（例如 mingyouyi）
```

也可以使用单连接串配置：
```bash
DB_URL=mysql://user:password@host:3306/mingyouyi
```

补充：当前生产环境后端数据库库名为 `mingyouyi`，敏感连接信息仅保存在 CloudRun 环境变量中，不写入仓库。

3. 启动后端
```bash
npm run server
```

4. 启动前端
```bash
npm run dev
```

## API 概览
- `POST /api/generate`：生成名字（并写入生成相关埋点）
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

收藏接口补充说明：
- `POST /api/favorites` 会同时保存收藏当时的结果内容和输入上下文。
- `GET /api/favorites` 返回的每条收藏除了名字与解释，还会带回：
  - `generation_id`
  - `favorite_keywords`
  - `favorite_meaning`
  - `favorite_name_mode`

## 生成策略说明（当前实现）
- 模型：`doubao-seed-1-8-251228`（结构化输出）。
- 后端会使用 `json_schema` 约束模型返回结构，优先解析 `{"items":[...]}`。
- 若首次解析失败，会触发一次更严格提示词的二次重试（`parse_retry=true`）。
- 已移除本地兜底结果；若重试后仍解析失败，接口返回 `500`，前端提示“生成失败，请稍后重试”。
- 前端加载态采用分阶段文案：`正在理解关键词 -> 正在创作 -> 正在润色`。
- 支持三种模式：`cn`（中文网名）/ `en`（英文名字）/ `mix`（中英混合名字）。
- 关键词入参会按分隔符拆分并校验：每次仅允许 `1-2` 个关键词。
- 前端已移除“偏好风格”选项，当前仅保留“期望寓意”（选填）。
- Prompt 已增强“立体深意/高级感/独特性”引导，并对缩写（如 `zk`/`wsz`）做语义化融合，降低“中文+字母硬拼”现象。
- 在 `mix` 模式且关键词为 3 位缩写时，会引导模型在 3 个结果里自然包含 `1-2` 个“三字中文 + 英文片段”结构。
- 后端会按当前模式对 3 个结果逐条做兼容性校验，避免中文模式混入英文结果、或英文模式混入中文结果。
- 结果解释不再出现“本次优先融合...”措辞。

## 收藏与分享海报
- 当前仅保留“保存海报”能力，不再提供系统分享按钮。
- 海报采用三卡片布局：
  - 第 1 张卡片：生成结果、寓意标题、解释、风格标签
  - 第 2 张卡片：用户输入的关键词 / 寓意方向
  - 第 3 张卡片：产品介绍与站点地址 `mingyouyi.cn`
- 海报预览会根据移动端弹窗空间自动缩放，但导出的图片仍使用独立的高清导出节点。
- 点击分享会记录 `click_share` 埋点，保存海报会记录 `save_poster` 埋点。
- 收藏页分享海报会优先读取收藏记录里的输入快照。

## 移动端兼容补充
- 复制功能使用 `navigator.clipboard` + `execCommand('copy')` 双通道兜底，提升手机浏览器兼容性。
- 分享海报弹窗会根据可视区域自动缩放，尽量保证预览内容和“保存海报”按钮同时可见。
- 结果页、收藏页和分享海报弹窗状态会写入 `sessionStorage`，手机切后台后再次进入时优先恢复现场。

## 关键接口示例
`POST /api/generate` 请求体：
```json
{
  "keywords": "月亮、海",
  "nameMode": "cn",
  "meaning": "自由",
  "userKey": "u_xxx",
  "sessionId": "s_xxx",
  "generationId": "gen_xxx"
}
```

说明：
- `keywords` 为字符串，后端会按 `,` / `，` / 空格 / 换行等分隔符拆分。
- 拆分后关键词数量必须在 `1-2` 之间。

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
npm run preview
```

说明：
- 当前仓库没有单独的 `build:prod` 脚本，生产构建直接使用 `npm run build`。
- 仅在“前端需要跨域直连后端”时，才建议显式设置 `VITE_API_BASE_URL`。
- `npm run build` 结束后会自动补齐静态托管的 SPA 回退入口文件，当前会为 `/admin` 以及 `src/landingPages.ts` 中声明的场景页路径生成对应的 `index.html`，避免 CloudBase 静态托管下直接访问子路径返回 `404`。

## 数据库迁移说明
- 首次建库请执行：`sql/app_schema.sql`
- 已有库升级到“收藏上下文”能力时，请手动执行：`sql/2026-03-28_add_favorite_context.sql`
- 当前后端启动时不会自动执行表结构迁移或历史数据回填，数据库变更需显式执行 SQL
- 建议将每次数据库变更记录到部署流程中，避免线上与本地结构不一致

## 手机局域网调试
- 前端已默认支持局域网访问（`vite --host=0.0.0.0`）。
- 后端在开发环境会自动放行私网来源（`192.168.x.x` / `10.x.x.x` / `172.16-31.x.x`）的 CORS，便于手机同网段联调。
- 生产环境仍需通过 `FRONTEND_ORIGIN` 白名单精确控制来源。

## CloudBase 说明
- 环境 ID：`ai-username-env-2glikc1y1cb803fb`
- 主服务：`ai-username-api-v2`
- 自定义域名：`mingyouyi.cn`、`www.mingyouyi.cn`
- HTTP 访问服务路由：
  - `/` -> 静态托管（前端）
  - `/api` -> `ai-username-api-v2`（CloudRun，已开启路径透传）
- 当前生产前端默认同域访问 `/api`，通常无需设置 `VITE_API_BASE_URL`
- 当前生产数据库库名：`mingyouyi`（其余敏感连接信息只在云端环境变量中维护）
- 后台接口始终支持本地与线上访问，不再区分 `ADMIN_LOCAL_ONLY` / `ADMIN_REQUIRE_AUTH` / `VITE_ENABLE_ADMIN`（这些开关已下线）。
- 后台登录仅依赖：
  - `ADMIN_USERNAME=你的后台账号`
  - `ADMIN_PASSWORD=你的后台密码`

## 文档索引
- 协作规范：`AGENTS.md`
- 技术文档：`TECHNICAL.md`
- 部署文档：`DEPLOYMENT.md`
- 后台文档：`ADMIN_DASHBOARD.md`
- PRD：`PRD.md`
- 增长策略：`GROWTH_STRATEGY.md`
- 场景页规划：`LANDING_PAGE_PLAN.md`
- 小红书内容手册：`XHS_CONTENT_PLAYBOOK.md`
- 小红书 10 篇终稿：`XHS_10_FINAL_POSTS.md`
- 数据库结构：`sql/app_schema.sql`
- 收藏上下文迁移：`sql/2026-03-28_add_favorite_context.sql`

## 高意图场景页（当前已落地）
- 当前已支持首批 4 个高意图场景页：`/wechat-nickname`、`/xiaohongshu-nickname`、`/english-nickname`、`/game-id`
- 场景页共用同一套前端模板，但会按路径切换首屏文案、默认模式、推荐输入、CTA、示例结果、FAQ 与 SEO Meta
- 当前首屏已支持“推荐输入一键填入”，用于降低移动端输入成本并强化场景匹配感
- 首页与各场景页之间已补充真实站内内链，方便用户跳转，也方便搜索引擎发现这些页面
- `public/sitemap.xml` 已包含首批 4 个高意图场景页，发布后需在 Search Console / Bing Webmaster Tools 手工提交收录
- 生产构建会自动为这些场景页和 `/admin` 生成静态托管回退入口，因此在 CloudBase 静态托管中可直接访问或刷新这些路径，而不会落成 COS `NoSuchKey` 404
