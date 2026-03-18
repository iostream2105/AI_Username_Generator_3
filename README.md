# AI 网名生成器

这是一个前后端分离的 AI 网名生成项目。用户输入关键词，并可选寓意与风格偏好，系统返回 3 个候选网名及解释。

## 当前线上部署
- 前端（CloudBase 静态托管）：
  https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/
- 后端（CloudRun）：
  https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com

## 项目结构
- `src/`：React + Vite 前端
- `src/services/ai.ts`：前端 API 请求与埋点上报封装
- `server/index.ts`：Express 后端服务（生成接口、收藏接口、埋点接口）
- `server/db.ts`：MySQL 连接与数据访问层（收藏 + 埋点写库）
- `cloudfunctions/generateApi/`：云函数备选实现
- `sql/analytics_schema.sql`：埋点数据库表结构
- `sql/analytics_tracking_design.md`：埋点事件字典与指标映射
- `sql/favorites_schema.sql`：收藏表结构
- `Dockerfile`：CloudRun 容器构建配置

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
- `GET /api/favorites?userKey=...`：查询收藏
- `POST /api/favorites`：新增收藏
- `DELETE /api/favorites`：取消收藏

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
npm run preview
```

## CloudBase 说明
- 环境 ID：`ai-username-env-2glikc1y1cb803fb`
- 主服务：`ai-username-api-v2`
- 生产构建前，请将 `VITE_API_BASE_URL` 设置为 CloudRun 域名

## 文档索引
- 协作规范：`AGENTS.md`
- 技术文档：`TECHNICAL.md`
- PRD：`PRD.md`
- 埋点表结构：`sql/analytics_schema.sql`
