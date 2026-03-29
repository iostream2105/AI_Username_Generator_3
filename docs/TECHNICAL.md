# 项目技术文档

## 1. 架构概览
本项目是一个 AI 网名生成应用：
- 前端：React + Vite + TypeScript
- 后端：Express + OpenAI 兼容 SDK（调用豆包）
- 数据库：CloudBase MySQL（收藏与埋点写库）
- 部署：CloudBase 静态托管（前端）+ CloudRun（后端）
- 当前后端形态：CloudRun（已移除备用云函数方案）

产品实现基线：
- 当前以移动端（手机端）浏览器为主要使用场景。
- 前端交互和视觉布局默认先满足手机端，再向桌面端做兼容扩展。

主流程：
1. 用户输入关键词（可选期望寓意，并可选择生成模式 `cn/en/mix`）
2. 前端调用 `POST /api/generate`，并携带 `userKey/sessionId/generationId`
3. 后端调用豆包模型（`doubao-seed-1-8-251228`），使用 `json_schema` 约束结构化输出
4. 若首次解析失败，后端使用更严格提示词做一次二次重试（不再使用本地兜底）
5. 后端写入生成相关埋点表（`analytics_generation_batch`、`analytics_generation_result`、`analytics_event_log`）
6. 前端在交互节点调用 `POST /api/track` 上报埋点事件
7. 前端通过 `POST /api/feedback` 提交满意度与建议反馈
8. 用户可将结果收藏到数据库，并同步保存该次生成的输入上下文
9. 用户可将结果导出为 PNG 分享海报，海报预览与导出使用独立节点

## 2. 目录说明
- `src/App.tsx`：前端主页面、状态管理、埋点触发、反馈交互与移动端返回逻辑
- `src/services/ai.ts`：前端 API 客户端与埋点上报
- `src/components/SharePoster.tsx`：分享海报组件，支持预览版与导出版
- `src/utils/share.ts`：海报导出与下载工具
- `src/utils/clipboard.ts`：复制能力封装，兼容移动端浏览器
- `src/types.ts`：前端类型定义
- `server/index.ts`：后端入口、CORS、模型调用与业务 API
- `server/db.ts`：MySQL 连接与数据访问层
- `sql/app_schema.sql`：数据库结构 SQL（埋点 + 收藏 + 反馈）
- `sql/2026-03-28_add_favorite_context.sql`：收藏上下文字段增量迁移脚本
- `sql/analytics_tracking_design.md`：事件命名与指标映射
- `cloudbaserc.json`：CloudBase 环境与云托管服务指向
- `DEPLOYMENT.md`：部署流程说明

## 3. 运行配置
后端环境变量：
- `DOUBAO_API_KEY`（必填）
- `FRONTEND_ORIGIN`（可选，逗号分隔，可配置 `*`）
- `ADMIN_USERNAME`（后台管理员账号，后台鉴权必填）
- `ADMIN_PASSWORD`（后台管理员密码，后台鉴权必填）
- `ADMIN_TOKEN_EXPIRE_HOURS`（可选，后台 token 过期小时数，默认 `12`）
- `DB_URL` 或 `MYSQL_URL`（可选，二选一）
- 或者拆分配置：
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

后端 CORS 说明：
- 生产环境（`NODE_ENV=production`）：严格按 `FRONTEND_ORIGIN` 白名单校验来源。
- 开发环境：额外自动放行局域网私网来源（`192.168.x.x` / `10.x.x.x` / `172.16-31.x.x`）用于手机联调。

前端构建变量：
- `VITE_API_BASE_URL`（可选；为空时默认同域调用 `/api/*`）

补充：
- 当前仓库没有单独的 `build:prod` 脚本，生产构建直接使用 `npm run build`。
- 当前线上主站通过同域路由访问后端（`https://mingyouyi.cn/api/*`）。

## 4. API 约定
### `POST /api/generate`
请求示例：
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

返回示例：
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

状态码：
- `400`：缺少关键词，或关键词拆分后数量不在 `1-2` 范围
- `500`：模型调用失败，或首次+二次重试后仍解析失败

生成接口实现要点：
- 当前模型：`doubao-seed-1-8-251228`
- 使用 `response_format: json_schema` + `strict: true`
- 支持 `nameMode`：`cn`（中文网名）/ `en`（英文名字）/ `mix`（中英混合名字），默认 `cn`
- 关键词字符串会按 `,` / `，` / 空格 / 换行拆分，拆分后仅允许 `1-2` 个
- Prompt 以“整体融合输入元素”为主，不做显式优先级排序
- Prompt 增强了“立体深意、高级感、独特性”目标约束
- 对缩写关键词（如 `zk`/`wsz`）增加语义化融合引导，降低“中文 + 字母硬拼”概率
- `mix` 模式下对 3 位缩写会引导生成中出现部分“三字中文 + 英文片段”结果（非强制全量）
- 当前会对 3 个结果逐条执行模式兼容性校验，中文模式不会放过中英混合结果，英文模式不会放过纯中文结果
- 结果解释文案避免“本次优先融合...”表述
- 成功事件中 `properties.parse_retry` 标识是否触发过二次重试
- `properties.fallback_used` 当前固定为 `false`（本地兜底逻辑已移除）
- 关键生成埋点会携带 `properties.name_mode`

### `POST /api/track`
用于写入 `analytics_event_log`，支持事件：
- `home_exposure`
- `input_keywords`
- `select_meaning`
- `select_style`（历史事件，当前前端已下线）
- `click_generate`
- `generate_success`
- `click_copy`
- `click_favorite`
- `click_share`
- `save_poster`
- `click_regenerate`
- `back_modify`

说明：
- 当事件为 `click_copy` / `click_favorite` 且提供了 `generation_id + result_rank` 时，后端会同步更新 `analytics_generation_result` 的 `copied_count` / `favorited_count`。

### `POST /api/feedback`
用于写入用户反馈表 `user_feedback`。

反馈类型：
- `satisfaction`：结果满意度反馈（`satisfied` / `unsatisfied`，可带 `reasonTag`）
- `general`：通用建议反馈（文本 `content`）

### 收藏接口
- `GET /api/favorites?userKey=...`
- `POST /api/favorites`
- `DELETE /api/favorites`

收藏接口字段补充：
- `POST /api/favorites` 请求体中的 `item` 目前支持：
  - `name`
  - `meaning_title`
  - `meaning_desc`
  - `style_tags`
  - `generation_id`
  - `favorite_keywords`
  - `favorite_meaning`
  - `favorite_name_mode`
- `GET /api/favorites` 返回值除结果内容外，还会带回收藏时的输入快照字段，供收藏页海报回显使用。

收藏数据表：`user_favorite_name`
- 关键字段：`generation_id`、`favorite_keywords_json`、`favorite_meaning`、`favorite_name_mode`

反馈数据表：`user_feedback`

### 后台鉴权与接口
- 登录接口：`POST /api/admin/login`
  - 入参：`{ "username": "...", "password": "..." }`
  - 成功返回：`{ "token": "...", "expiresAt": 1740000000000, "username": "admin" }`
- 受保护接口：
  - `GET /api/admin/overview`
  - `GET /api/admin/generations`
  - `GET /api/admin/events`
  - `GET /api/admin/favorites`
  - `GET /api/admin/feedback`
  - `GET /api/admin/export`
- 鉴权方式：除 `/api/admin/login` 外，`/api/admin/*` 需携带 `Authorization: Bearer <token>`。

## 5. 埋点入库现状
已接入实时写库：
- `analytics_event_log`
- `analytics_generation_batch`
- `analytics_generation_result`
- `user_feedback`

未接入：
- `analytics_metrics_daily`（需要离线聚合作业）

## 6. 部署拓扑
### 生产环境
- 主站域名：`https://mingyouyi.cn/`
  - `/` -> CloudBase 静态托管
  - `/api/*` -> CloudRun 服务 `ai-username-api-v2`（HTTP 访问服务路由，路径透传开启）
- 前端默认域名：`https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/`
- 后端默认域名：`https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com`
- 数据库：CloudBase MySQL（环境内）
  - 当前生产库名：`mingyouyi`
- 详细部署步骤见：`DEPLOYMENT.md`

### 本地环境
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- Vite 开发代理：`/api` -> `3001`
- 手机同局域网访问：`http://<电脑局域网IP>:3000`

## 7. 验证建议
最低质量门槛：
1. `npm run lint`
2. 手工验证主链路：首页 -> 生成 -> 结果（优先使用手机端或手机尺寸模拟）
3. 验证收藏增删查
4. 验证复制能力在桌面端和手机浏览器都可用
5. 验证海报预览与“保存海报”链路
6. 验证埋点入库（检查 `analytics_event_log`、`analytics_generation_batch`、`analytics_generation_result`）
7. 验证反馈入库（检查 `user_feedback`）
8. 验证系统返回键回退（`favorites/results` -> 上一级视图，而非直接退出）
9. 验证手机切后台再返回后，结果页 / 收藏页 / 分享海报弹窗能否恢复状态

补充要求：
- 若前端改动影响布局、弹窗、按钮可达性或输入体验，应优先以手机端实际效果作为是否通过的标准。

## 8. 风险与已知问题
- 仓库内部分中文字符串存在历史编码污染，影响可读性但不一定影响运行。
- 尚未引入自动化测试，当前依赖类型检查和手工验证。

## 9. 数据库迁移策略
- 当前后端启动时不会自动检查或补齐数据库表结构。
- 首次初始化数据库请执行：`sql/app_schema.sql`
- 已有库升级到“收藏上下文”能力时，请执行：`sql/2026-03-28_add_favorite_context.sql`
- 部署前若涉及 SQL 结构变更，请先执行迁移，再部署后端。

## 10. 建议的后续工作
1. 增加埋点日聚合作业，落地 `analytics_metrics_daily`。
2. 为 `/api/generate` 和 `/api/track` 增加基础自动化测试。
3. 分批修复中文乱码文本，并做回归验证。

## 11. 后台管理端增量实现（当前代码已落地）
### 11.1 前端入口
- 后台前端页面：`src/AdminApp.tsx`
- 后台 API 客户端：`src/admin/service.ts`
- 后台类型定义：`src/admin/types.ts`
- 入口开关：`src/main.tsx`
  - 路径命中 `/admin` 时直接渲染后台页面
  - 其他情况渲染 App 页面
  - 不再依赖 `VITE_ENABLE_ADMIN` 开关

### 11.2 后端接口与保护
`server/index.ts` 已新增后台接口：
- `POST /api/admin/login`
- `GET /api/admin/overview`
- `GET /api/admin/generations`
- `GET /api/admin/events`
- `GET /api/admin/favorites`
- `GET /api/admin/feedback`
- `GET /api/admin/export`

接口保护：
- 不再限制“仅本地访问”
- 登录接口使用账号密码校验
- 其余后台接口统一要求 Bearer Token

### 11.3 查询与导出策略
- 默认时间窗口：近 7 天
- 日期范围上限：31 天
- 分页默认：20，上限：100
- 导出：CSV（UTF-8 BOM）
- 总览趋势：按天聚合并返回倒序（最新日期优先）

## 12. 用户端近期实现补充
### 12.1 输入与埋点
- 关键词输入增加输入法组合态保护，降低 iOS 输入法分词错乱
- `home_exposure` 增加运行时去重，避免开发态 StrictMode 双触发导致重复曝光

### 12.2 交互与展示
- 首页顶部收藏入口增加“我的收藏”文案提示
- 首页主副文案、关键词说明文案针对移动端做了字号与布局微调
- 结果卡标题改为“默认字号 + 仅在溢出时缩小”，避免短名字过大、长名字换行
- 结果卡新增海报分享入口，前端仅保留“保存海报”
- 收藏页分享海报会优先使用收藏时保存的输入上下文

### 12.3 移动端兼容
- `index.html` 增加禁止缩放配置与 iOS gesture 兜底拦截
- `src/index.css` 增加全局横向溢出隐藏，减少小屏横向滑动问题
- 复制能力加入 `execCommand('copy')` 兜底
- 应用状态写入 `sessionStorage`，降低手机浏览器回收标签页后直接跳回首页的问题
- 分享海报弹窗会按视口空间自动缩放预览内容，尽量保证整张海报与保存按钮同时可见

## 13. 分享海报实现说明
- 预览海报与导出海报共用 `SharePoster` 组件，但使用不同尺寸参数。
- 导出时使用隐藏节点渲染高清海报，再通过 `html-to-image` 生成 PNG。
- 当前海报结构为三卡片：
  - 结果卡片
  - 输入卡片
  - 品牌介绍卡片
- 站点文案与站点地址统一在第 3 张卡片展示。
## 场景页增量说明（2026-03）
- 新增 `src/landingPages.ts`，集中维护首页与高意图场景页配置。
- 当前首批场景页路径：
  - `/wechat-nickname`
  - `/xiaohongshu-nickname`
  - `/english-nickname`
  - `/game-id`
- `src/main.tsx` 会根据 pathname 解析场景页配置，并动态设置页面 `title`、`description`、`keywords`、`canonical`、`og` 与 `twitter` meta。
- `src/App.tsx` 当前已接入配置驱动的首页骨架字段：Hero 文案、默认生成模式、结果示例、场景标签区、价值点区、FAQ 区。
- `src/App.tsx` 本轮继续接入场景化首屏增强字段：Hero 亮点标签、关键词提示文案、推荐输入按钮、模式推荐提示、场景专属 CTA。
- 推荐输入按钮支持一键写入 `keywords`，并可同时切换推荐的 `meaning` 与 `nameMode`，用于降低移动端输入成本。
- 后续新增场景页时，优先新增配置，不再复制整页组件。
