# 后台管理端项目文档

## 1. 模块定位
后台管理端是本项目的本地运营分析面板，定位为只读工具，不提供数据编辑与删除能力。

主要目标：
- 便捷查看核心运营指标和趋势
- 快速检索生成/事件/收藏/反馈明细
- 支持 CSV 导出，便于离线分析

## 2. 入口与访问策略
### 2.1 前端入口
- 入口路径：`/admin`
- 页面实现：`src/AdminApp.tsx`
- 入口开关：`src/main.tsx` 中 `VITE_ENABLE_ADMIN`

规则：
- `VITE_ENABLE_ADMIN=true`：允许访问后台页面
- `VITE_ENABLE_ADMIN=false`：即使访问 `/admin` 也回退渲染 App 端
- 开发环境默认可开启后台（配合 `VITE_ENABLE_ADMIN`）

### 2.2 后端访问保护
后端所有后台接口统一挂载在 `/api/admin/*`，并受本地访问保护：
- 开关变量：`ADMIN_LOCAL_ONLY`（默认 `true`）
- 默认仅允许 `localhost / 127.0.0.1 / ::1`
- 非本地访问返回 `403`

## 3. 后台功能清单（当前实现）
五个页面页签：
1. 总览看板（overview）
2. 生成记录（generations）
3. 事件日志（events）
4. 收藏列表（favorites）
5. 反馈列表（feedback）

通用能力：
- 默认近 7 天时间范围
- 自定义起止日期筛选（最大 31 天）
- 手动刷新
- 分页查询（默认 20，最大 100）
- CSV 导出

## 4. 后端接口定义
统一返回结构：
- `data`: 主数据
- `pagination`: 分页信息（明细接口）
- `summary`: 当前筛选时间范围等摘要

### 4.1 总览
- `GET /api/admin/overview`
- 参数：`startDate`、`endDate`
- 返回：
  - KPI：曝光、点击生成、生成成功、成功率、复制率、收藏率、平均耗时
  - 趋势：按天数据（当前实现为日期倒序，最近日期在上）

### 4.2 生成记录
- `GET /api/admin/generations`
- 参数：
  - 时间：`startDate`、`endDate`
  - 过滤：`isSuccess`、`meaningTag`、`styleTag`
  - 分页：`page`、`pageSize`

### 4.3 事件日志
- `GET /api/admin/events`
- 参数：
  - 时间：`startDate`、`endDate`
  - 过滤：`eventName`、`generationId`
  - 分页：`page`、`pageSize`

### 4.4 收藏列表
- `GET /api/admin/favorites`
- 参数：
  - 时间：`startDate`、`endDate`
  - 过滤：`userKey`、`name`
  - 分页：`page`、`pageSize`

### 4.5 反馈列表
- `GET /api/admin/feedback`
- 参数：
  - 时间：`startDate`、`endDate`
  - 过滤：`feedbackType`、`satisfactionValue`
  - 分页：`page`、`pageSize`

### 4.6 导出接口
- `GET /api/admin/export`
- 参数：
  - `module=overview|generations|events|favorites|feedback`
  - 其余筛选参数复用对应模块
- 返回：
  - `text/csv; charset=utf-8`
  - 包含 UTF-8 BOM（兼容 Excel）

## 5. 数据来源映射
- `analytics_event_log`：事件日志、总览部分指标
- `analytics_generation_batch`：生成请求记录、耗时与成功率相关数据
- `analytics_generation_result`：复制/收藏计数回填（配合事件）
- `user_favorite_name`：收藏列表
- `user_feedback`：反馈列表

说明：
- `analytics_metrics_daily` 目前仍是预留聚合表，后台总览优先基于事实表实时查询。

## 6. 本地运行与验证
1. 启动后端：`npm run server`
2. 启动前端：`npm run dev`
3. 访问后台：`http://localhost:3000/admin`

建议验证项：
- 五个页签可正常查询
- 筛选、分页、手动刷新生效
- 导出文件可下载且内容与筛选一致
- 非本地来源访问 `/api/admin/*` 返回 `403`

## 7. 发布策略建议
如果生产只发布 App 端，不暴露后台入口：
1. 使用 `npm run build:prod` 构建（脚本中强制 `VITE_ENABLE_ADMIN=false`）
2. 仅上传 `dist/` 到静态托管
3. 不提供 `/admin/index.html` 静态入口

补充：即使前端不暴露后台入口，后端仍建议保留 `ADMIN_LOCAL_ONLY=true` 保护。
