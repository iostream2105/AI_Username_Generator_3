# 部署文档

## 1. 线上拓扑
- 主域名：`https://mingyouyi.cn/`
- 前端：CloudBase 静态托管
- 后端：CloudRun 容器服务 `ai-username-api-v2`
- 同域路由：
  - `/` -> 前端静态资源
  - `/api/*` -> CloudRun 后端
- 数据库：CloudBase MySQL，当前生产库名为 `mingyouyi`

## 2. 部署前准备
### 2.1 环境与权限
- 确保已完成 CloudBase 登录并绑定环境：`ai-username-env-2glikc1y1cb803fb`
- 确保本地可执行：
  - `npm install`
  - `npm run lint`
  - `npm run build`

### 2.2 关键配置
- 前端默认通过同域 `/api` 访问后端，通常不需要设置 `VITE_API_BASE_URL`
- 后端 CloudRun 环境变量至少包含：
  - `DOUBAO_API_KEY`
  - `FRONTEND_ORIGIN`
  - `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_TOKEN_EXPIRE_HOURS`

### 2.3 数据库迁移
- 首次建库：执行 `sql/app_schema.sql`
- 已有库升级到“收藏上下文”能力：执行 `sql/2026-03-28_add_favorite_context.sql`
- 注意：当前后端启动时不会自动迁移数据库，必须手动执行 SQL

## 3. 本地发布前检查
按顺序执行：

```bash
npm install
npm run lint
npm run build
```

建议手工验证：
1. 首页 -> 生成 -> 结果
2. 复制结果
3. 收藏 / 取消收藏
4. 保存海报
5. 后台登录与基础查询

## 4. 前端部署流程
### 4.1 构建
```bash
npm run build
```

构建产物位于：
- `dist/`

### 4.2 上传到 CloudBase 静态托管
使用 CloudBase 工具将 `dist/` 上传到静态托管根目录。

关键点：
- 上传目标是静态托管根目录 `/`
- 上传后 CDN 缓存可能会有几分钟延迟
- 验证时建议带时间戳参数，例如：
  - `https://mingyouyi.cn/?t=20260328`

## 5. 后端部署流程
### 5.1 服务信息
- 服务名：`ai-username-api-v2`
- 服务类型：CloudRun 容器模式
- Dockerfile：仓库根目录 `Dockerfile`

### 5.2 部署方式
将当前仓库根目录作为 CloudRun 部署目录，沿用已有服务配置进行更新部署。

当前关键配置：
- `BuildDir`：`.`
- `Dockerfile`：`Dockerfile`
- `Cpu`：`0.5`
- `Mem`：`1`
- `MinNum`：`1`
- `MaxNum`：`2`
- `OpenAccessTypes`：`PUBLIC`、`MINIAPP`、`OA`
- `Port`：`80`

### 5.3 部署注意事项
- 不要随意改动现有服务名，否则会影响同域 `/api` 路由
- 若改动了环境变量，请同步更新 CloudRun 服务配置
- 若有数据库结构变更，请先执行 SQL，再部署后端

## 6. 部署后验证
### 6.1 前端验证
- 访问主域名：
  - `https://mingyouyi.cn/?t=<timestamp>`
- 访问默认静态托管域名：
  - `https://ai-username-env-2glikc1y1cb803fb-1330697233.tcloudbaseapp.com/?t=<timestamp>`

### 6.2 后端验证
- 默认 CloudRun 域名：
  - `https://ai-username-api-v2-234853-9-1330697233.sh.run.tcloudbase.com`
- 接口健康性可用“缺参数返回 400”的方式快速校验，例如：
  - `GET /api/favorites` 未携带 `userKey` 时应返回 `400`

### 6.3 主链路验证
1. 首页输入关键词并生成结果
2. 结果页复制
3. 结果页收藏
4. 结果页保存海报
5. 我的收藏页查看与分享海报
6. 后台 `POST /api/admin/login` 登录

## 7. 常见发布项与对应操作
### 7.1 纯前端改动
- 执行 `npm run build`
- 仅上传 `dist/` 到静态托管

### 7.2 纯后端改动
- 如涉及数据库变更，先执行 SQL
- 重新部署 CloudRun 服务 `ai-username-api-v2`

### 7.3 前后端同时改动
推荐顺序：
1. 执行数据库迁移
2. 部署后端
3. 构建并上传前端
4. 做同域联调验证

## 8. 回滚建议
- 前端回滚：重新上传上一版 `dist/`
- 后端回滚：将 CloudRun 回滚到上一版镜像或重新部署上一版代码
- 数据库回滚：如涉及结构变更，需单独准备回滚 SQL；当前仓库未内置自动回滚脚本

## 9. CloudBase 控制台入口
- 概览：
  - `https://tcb.cloud.tencent.com/dev?envId=ai-username-env-2glikc1y1cb803fb#/overview`
- 静态托管：
  - `https://tcb.cloud.tencent.com/dev?envId=ai-username-env-2glikc1y1cb803fb#/static-hosting`
- CloudRun：
  - `https://tcb.cloud.tencent.com/dev?envId=ai-username-env-2glikc1y1cb803fb#/platform-run`
- MySQL：
  - `https://tcb.cloud.tencent.com/dev?envId=ai-username-env-2glikc1y1cb803fb#/db/mysql/table/default/`

## 10. 当前版本的部署记录建议
每次发布建议至少记录：
- 提交哈希
- 是否包含数据库迁移
- 前端是否已上传静态托管
- 后端是否已更新 CloudRun
- 主域名验证结果
- `/api/favorites` 或 `/api/generate` 验证结果
## 场景页发布补充（2026-03）
- 当前首批高意图场景页路径：
  - `/wechat-nickname`
  - `/xiaohongshu-nickname`
  - `/english-nickname`
  - `/game-id`
- 这些路径仍然走前端单页应用入口，部署后需要重点验证：
  - 直接访问子路径是否能返回前端页面
  - 刷新子路径是否不会返回 404
  - 场景页子路径下的静态资源是否正常加载
- 发布后建议手工验证：
  - `https://mingyouyi.cn/wechat-nickname`
  - `https://mingyouyi.cn/xiaohongshu-nickname`
  - `https://mingyouyi.cn/english-nickname`
  - `https://mingyouyi.cn/game-id`
  - 各场景页首屏的推荐输入按钮、场景 CTA、示例区标题是否与路径对应
  - `https://mingyouyi.cn/sitemap.xml` 是否已包含上述场景页 URL
  - 页面源码或渲染后 DOM 中是否存在 canonical、JSON-LD 与站内内链
- 若 CloudBase 静态托管的子路径刷新存在 404，需要补充 SPA 回退策略，确保这些高意图页都能回落到前端入口 `index.html`。

## 搜索引擎提交补充
- 前端发布后，建议把 `https://mingyouyi.cn/sitemap.xml` 提交到 Google Search Console 与 Bing Webmaster Tools
- 如果场景页刚上线，短期内搜索结果仍可能优先展示首页；待抓取、收录和站内外链接积累后，才会逐步切到对应场景页
