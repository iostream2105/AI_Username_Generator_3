# 项目技术文档

## 1. 架构概览
本项目是一个 AI 网名生成应用：
- 前端：React + Vite + TypeScript
- 后端：Express + OpenAI 兼容 SDK（调用豆包）
- 数据库：CloudBase MySQL（收藏与埋点写库）
- 部署：CloudBase 静态托管（前端）+ CloudRun（后端）
- 备选后端：CloudBase HTTP 云函数（`cloudfunctions/generateApi/`）

主流程：
1. 用户输入关键词（可选寓意和风格）
2. 前端调用 `POST /api/generate`，并携带 `userKey/sessionId/generationId`
3. 后端调用豆包模型，返回结构化网名结果
4. 后端写入生成相关埋点表（`analytics_generation_batch`、`analytics_generation_result`、`analytics_event_log`）
5. 前端在交互节点调用 `POST /api/track` 上报埋点事件

## 2. 目录说明
- `src/App.tsx`：前端主页面、状态管理、埋点触发
- `src/services/ai.ts`：前端 API 客户端与埋点上报
- `src/types.ts`：前端类型定义
- `server/index.ts`：后端入口、CORS、模型调用与业务 API
- `server/db.ts`：MySQL 连接与数据访问层
- `cloudfunctions/generateApi/`：云函数版本 API（备用方案）
- `sql/analytics_schema.sql`：埋点 SQL 表结构
- `sql/analytics_tracking_design.md`：事件命名与指标映射
- `sql/favorites_schema.sql`：收藏表结构
- `cloudbaserc.json`：CloudBase 环境与云托管服务指向

## 3. 运行配置
后端环境变量：
- `DOUBAO_API_KEY`（必填）
- `FRONTEND_ORIGIN`（可选，逗号分隔，可配置 `*`）
- `DB_URL` 或 `MYSQL_URL`（可选，二选一）
- 或者拆分配置：
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

前端构建变量：
- `VITE_API_BASE_URL`（生产环境建议指向 CloudRun 域名）

## 4. API 约定
### `POST /api/generate`
请求示例：
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
- `400`：缺少关键词
- `503`：数据库未配置
- `500`：模型调用失败或解析失败

### `POST /api/track`
用于写入 `analytics_event_log`，支持事件：
- `home_exposure`
- `input_keywords`
- `select_meaning`
- `select_style`
- `click_generate`
- `generate_success`
- `click_copy`
- `click_favorite`
- `click_regenerate`
- `back_modify`

说明：
- 当事件为 `click_copy` / `click_favorite` 且提供了 `generation_id + result_rank` 时，后端会同步更新 `analytics_generation_result` 的 `copied_count` / `favorited_count`。

### 收藏接口
- `GET /api/favorites?userKey=...`
- `POST /api/favorites`
- `DELETE /api/favorites`

收藏数据表：`user_favorite_name`

## 5. 埋点入库现状
已接入实时写库：
- `analytics_event_log`
- `analytics_generation_batch`
- `analytics_generation_result`

未接入：
- `analytics_metrics_daily`（需要离线聚合作业）

## 6. 部署拓扑
### 生产环境
- 前端：CloudBase 静态托管域名
- 后端：CloudRun 公网域名（服务名：`ai-username-api-v2`）
- 数据库：CloudBase MySQL（环境内）

### 本地环境
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- Vite 开发代理：`/api` -> `3001`

## 7. 验证建议
最低质量门槛：
1. `npm run lint`
2. 手工验证主链路：首页 -> 生成 -> 结果
3. 验证收藏增删查
4. 验证埋点入库（检查 `analytics_event_log`、`analytics_generation_batch`、`analytics_generation_result`）

## 8. 风险与已知问题
- 仓库内部分中文字符串存在历史编码污染，影响可读性但不一定影响运行。
- 尚未引入自动化测试，当前依赖类型检查和手工验证。

## 9. 建议的后续工作
1. 增加埋点日聚合作业，落地 `analytics_metrics_daily`。
2. 为 `/api/generate` 和 `/api/track` 增加基础自动化测试。
3. 分批修复中文乱码文本，并做回归验证。
