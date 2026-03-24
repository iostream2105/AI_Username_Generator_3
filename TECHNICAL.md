# 项目技术文档

## 1. 架构概览
本项目是一个 AI 网名生成应用：
- 前端：React + Vite + TypeScript
- 后端：Express + OpenAI 兼容 SDK（调用豆包）
- 数据库：CloudBase MySQL（收藏与埋点写库）
- 部署：CloudBase 静态托管（前端）+ CloudRun（后端）
- 当前后端形态：CloudRun（已移除备用云函数方案）

主流程：
1. 用户输入关键词（可选期望寓意，并可选择生成模式 `cn/en/mix`）
2. 前端调用 `POST /api/generate`，并携带 `userKey/sessionId/generationId`
3. 后端调用豆包模型（`doubao-seed-1-8-251228`），使用 `json_schema` 约束结构化输出
4. 若首次解析失败，后端使用更严格提示词做一次二次重试（不再使用本地兜底）
5. 后端写入生成相关埋点表（`analytics_generation_batch`、`analytics_generation_result`、`analytics_event_log`）
6. 前端在交互节点调用 `POST /api/track` 上报埋点事件
7. 前端通过 `POST /api/feedback` 提交满意度与建议反馈

## 2. 目录说明
- `src/App.tsx`：前端主页面、状态管理、埋点触发、反馈交互与移动端返回逻辑
- `src/services/ai.ts`：前端 API 客户端与埋点上报
- `src/types.ts`：前端类型定义
- `server/index.ts`：后端入口、CORS、模型调用与业务 API
- `server/db.ts`：MySQL 连接与数据访问层
- `sql/app_schema.sql`：数据库结构 SQL（埋点 + 收藏 + 反馈）
- `sql/analytics_tracking_design.md`：事件命名与指标映射
- `cloudbaserc.json`：CloudBase 环境与云托管服务指向

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
- 当前 `npm run build:prod` 与 `npm run build` 等价，不再默认注入 CloudRun 域名。
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

收藏数据表：`user_favorite_name`

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

### 本地环境
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- Vite 开发代理：`/api` -> `3001`
- 手机同局域网访问：`http://<电脑局域网IP>:3000`

## 7. 验证建议
最低质量门槛：
1. `npm run lint`
2. 手工验证主链路：首页 -> 生成 -> 结果
3. 验证收藏增删查
4. 验证埋点入库（检查 `analytics_event_log`、`analytics_generation_batch`、`analytics_generation_result`）
5. 验证反馈入库（检查 `user_feedback`）
6. 验证系统返回键回退（`favorites/results` -> 上一级视图，而非直接退出）

## 8. 风险与已知问题
- 仓库内部分中文字符串存在历史编码污染，影响可读性但不一定影响运行。
- 尚未引入自动化测试，当前依赖类型检查和手工验证。

## 9. 建议的后续工作
1. 增加埋点日聚合作业，落地 `analytics_metrics_daily`。
2. 为 `/api/generate` 和 `/api/track` 增加基础自动化测试。
3. 分批修复中文乱码文本，并做回归验证。

## 10. 后台管理端增量实现（当前代码已落地）
### 10.1 前端入口
- 后台前端页面：`src/AdminApp.tsx`
- 后台 API 客户端：`src/admin/service.ts`
- 后台类型定义：`src/admin/types.ts`
- 入口开关：`src/main.tsx`
  - 路径命中 `/admin` 时直接渲染后台页面
  - 其他情况渲染 App 页面
  - 不再依赖 `VITE_ENABLE_ADMIN` 开关

### 10.2 后端接口与保护
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

### 10.3 查询与导出策略
- 默认时间窗口：近 7 天
- 日期范围上限：31 天
- 分页默认：20，上限：100
- 导出：CSV（UTF-8 BOM）
- 总览趋势：按天聚合并返回倒序（最新日期优先）

## 11. 用户端近期实现补充
### 11.1 输入与埋点
- 关键词输入增加输入法组合态保护，降低 iOS 输入法分词错乱
- `home_exposure` 增加运行时去重，避免开发态 StrictMode 双触发导致重复曝光

### 11.2 交互与展示
- 首页顶部收藏入口增加“我的收藏”文案提示
- 首页主副文案、关键词说明文案针对移动端做了字号与布局微调

### 11.3 移动端兼容
- `index.html` 增加禁止缩放配置与 iOS gesture 兜底拦截
- `src/index.css` 增加全局横向溢出隐藏，减少小屏横向滑动问题
