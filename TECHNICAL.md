# 项目技术文档

## 1. 架构概览
本项目是一个 AI 网名生成应用：
- 前端：React + Vite + TypeScript
- 后端：Express + OpenAI 兼容 SDK（调用豆包）
- 部署：CloudBase 静态托管（前端）+ CloudRun（后端）
- 备选后端：CloudBase HTTP 云函数（`cloudfunctions/generateApi/`）

主流程：
1. 用户输入关键词（可选寓意和风格）
2. 前端调用 `POST /api/generate`
3. 后端拼接 Prompt 并请求豆包模型
4. 返回结构化 JSON，前端渲染结果卡片

## 2. 目录说明
- `src/App.tsx`：前端主页面与视图状态管理
- `src/services/ai.ts`：前端 API 客户端
- `src/types.ts`：前端类型定义
- `server/index.ts`：后端入口、CORS、模型调用逻辑
- `cloudfunctions/generateApi/`：云函数版本 API
- `sql/analytics_schema.sql`：埋点 SQL 表结构
- `sql/analytics_tracking_design.md`：事件命名与指标映射
- `cloudbaserc.json`：CloudBase 环境与云托管服务指向

## 3. 运行配置
后端主要环境变量：
- `DOUBAO_API_KEY`（必填）
- `FRONTEND_ORIGIN`（可选，逗号分隔，可配置 `*`）

前端构建变量：
- `VITE_API_BASE_URL`（生产环境建议指向 CloudRun 域名）

## 4. API 约定
### `POST /api/generate`
请求示例：
```json
{ "keywords": "月亮、海", "meaning": "自由", "style": "文艺" }
```
返回示例：
```json
[
  {
    "name": "示例网名",
    "meaning_title": "寓意标题",
    "meaning_desc": "一句话解释",
    "style_tags": ["文艺", "清冷"]
  }
]
```

状态码：
- `400`：缺少关键词
- `500`：模型调用失败或解析失败

## 5. 部署拓扑
### 生产环境
- 前端：CloudBase 静态托管域名
- 后端：CloudRun 公网域名（服务名：`ai-username-api-v2`）

### 本地环境
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- Vite 开发代理：`/api` -> `3001`

## 6. 数据与埋点现状
PRD 第 16 节埋点表结构已在 `sql/` 提供并已在 CloudBase SQL 设计完成：
- `analytics_event_log`
- `analytics_generation_batch`
- `analytics_generation_result`
- `analytics_metrics_daily`

当前分支的核心运行逻辑仍以“网名生成”为主，埋点写库接入可作为下一阶段实施。

## 7. 风险与已知问题
- 仓库内部分中文字符串存在历史编码污染，影响可读性但不一定影响运行。
- 尚未引入自动化测试，当前依赖类型检查和手工验证。

## 8. 建议的后续工作
1. 分批修复中文乱码文本，并做回归验证。
2. 接入埋点事件写库链路并产出日聚合任务。
3. 增加基础自动化测试（至少覆盖 `/api/generate`）。