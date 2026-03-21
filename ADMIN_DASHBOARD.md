# 后台管理端项目文档

## 1. 模块定位
后台管理端是本项目的运营分析面板，定位为只读工具，不提供数据编辑与删除能力。

主要目标：
- 便捷查看核心运营指标和趋势
- 快速检索生成/事件/收藏/反馈明细
- 支持 CSV 导出，便于离线分析

## 2. 入口与访问策略
### 2.1 前端入口
- 入口路径：`/admin`
- 页面实现：`src/AdminApp.tsx`
- 入口路由规则：`src/main.tsx` 路径命中 `/admin` 直接渲染后台页面（不再依赖 `VITE_ENABLE_ADMIN`）

### 2.2 后端访问保护
后端所有后台接口统一挂载在 `/api/admin/*`，并采用账号密码登录鉴权：
- 登录接口：`POST /api/admin/login`
- 其余后台接口：必须携带 `Authorization: Bearer <token>`
- 后台账号来源：`ADMIN_USERNAME` / `ADMIN_PASSWORD` 环境变量

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

### 4.7 登录接口
- `POST /api/admin/login`
- 请求体：
  - `username`
  - `password`
- 返回：
  - `token`
  - `expiresAt`（毫秒时间戳）
  - `username`

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
- 未登录访问 `/api/admin/*`（非 `/api/admin/login`）返回 `401`
- 使用登录 token 访问后台查询接口返回 `200`

## 7. 发布策略建议
当前默认策略为：生产环境可访问后台页面与后台接口，并通过账号密码登录鉴权进行访问控制。

推荐上线前检查：
1. 已配置 `ADMIN_USERNAME`、`ADMIN_PASSWORD`。
2. `POST /api/admin/login` 可成功返回 token。
3. 使用 token 可访问后台接口（overview / 列表 / 导出）。
