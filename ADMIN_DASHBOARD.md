# 后台管理端项目文档

## 1. 模块定位
后台管理端是本项目的只读运营分析面板，用于查看核心指标、检索明细数据、导出 CSV，不提供在线编辑、删除或人工修正数据的能力。

当前后台聚焦三类目标：
- 观察产品主链路转化，例如首页曝光、点击生成、生成成功、分享与保存海报。
- 快速检索生成记录、事件日志、收藏记录、反馈记录。
- 导出当前筛选结果，供离线分析或二次整理。

## 2. 入口与访问控制

### 2.1 前端入口
- 访问路径：`/admin`
- 页面实现：[src/AdminApp.tsx](D:/Dev/AI-Project/AI_Username_Generator_3/src/AdminApp.tsx)
- 主入口判断：[src/main.tsx](D:/Dev/AI-Project/AI_Username_Generator_3/src/main.tsx)

当前实现中，前端会在路径命中 `/admin` 时直接渲染后台页面，不再依赖额外的功能开关。

### 2.2 SEO 与搜索引擎策略
- `/admin` 页面会在前端入口中写入 `robots=noindex,nofollow`
- 后台页面默认不希望被搜索引擎收录

### 2.3 登录鉴权
- 登录接口：`POST /api/admin/login`
- 其余后台接口：统一挂载在 `/api/admin/*`
- 鉴权方式：`Authorization: Bearer <token>`
- 账号密码来源：`ADMIN_USERNAME`、`ADMIN_PASSWORD`
- Token 默认有效期：`ADMIN_TOKEN_EXPIRE_HOURS`，默认 12 小时

### 2.4 前端 Token 行为
- 本地存储 key：`ai_admin_token`
- 实现文件：[src/admin/service.ts](D:/Dev/AI-Project/AI_Username_Generator_3/src/admin/service.ts)
- 当接口返回 `401` 或 `Unauthorized` 时，前端会自动清除本地 token，并回到登录态

## 3. 当前已实现功能
后台目前包含 5 个标签页：
1. 总览看板
2. 生成记录
3. 事件日志
4. 收藏
5. 反馈

通用能力：
- 默认查询近 7 天数据
- 支持自定义开始日期、结束日期
- 单次查询时间范围最大 31 天
- 支持手动刷新
- 明细列表默认每页 20 条，后端上限 100 条
- 每个标签页都支持导出 CSV

## 4. 总览看板

### 4.1 KPI 卡片
当前总览页展示 6 个核心数值：
- 首页曝光 `home_exposure`
- 点击生成 `click_generate`
- 生成成功 `generate_success`
- 点击分享 `click_share`
- 保存海报 `save_poster`
- 平均耗时（ms）`avg_latency_ms`

### 4.2 比率卡片
当前总览页展示 5 个比率指标：
- 生成成功率 `generate_success_rate`
- 复制率 `copy_rate`
- 收藏率 `favorite_rate`
- 分享点击率 `share_click_rate`
- 海报保存率 `poster_save_rate`

当前口径：
- `generate_success_rate = generate_success / click_generate`
- `copy_rate = click_copy / generate_success`
- `favorite_rate = click_favorite / generate_success`
- `share_click_rate = click_share / generate_success`
- `poster_save_rate = save_poster / click_share`

### 4.3 趋势表
总览趋势表按天展示，并按日期倒序返回。当前列为：
- 日期
- 首页曝光
- 点击生成
- 生成成功
- 点击分享
- 保存海报
- 成功率%
- 分享点击率%
- 海报保存率%
- 复制率%
- 收藏率%
- 平均耗时（ms）

## 5. 各标签页展示与筛选

### 5.1 生成记录
接口：`GET /api/admin/generations`

支持筛选：
- `startDate`
- `endDate`
- `isSuccess`
- `meaningTag`
- `styleTag`
- `page`
- `pageSize`

当前页面展示列：
- 生成批次 ID
- 输入关键词
- 期望寓意
- 风格标签
- 状态
- 耗时（ms）
- 结果数
- 请求时间

后端实际返回字段比页面展示更多，还包括：
- `user_key`
- `session_id`
- `responded_at`
- `model_name`
- `error_code`

### 5.2 事件日志
接口：`GET /api/admin/events`

支持筛选：
- `startDate`
- `endDate`
- `eventName`
- `generationId`
- `page`
- `pageSize`

当前页面展示列：
- 发生时间
- 事件名称
- 生成批次 ID
- 结果名称
- 执行结果
- 错误码
- 附加信息

当前前端会把事件名转成“中文说明 + 英文事件标识”的形式，例如：
- `点击分享（click_share）`
- `保存海报（save_poster）`

### 5.3 收藏
接口：`GET /api/admin/favorites`

支持筛选：
- `startDate`
- `endDate`
- `userKey`
- `name`
- `page`
- `pageSize`

当前页面展示列：
- 用户标识
- 网名
- 寓意标题
- 风格标签
- 收藏时间

后端实际返回字段比页面展示更多，还包括：
- `meaning_desc`
- `generation_id`
- `favorite_keywords`
- `favorite_meaning`
- `favorite_name_mode`
- `updated_at`

### 5.4 反馈
接口：`GET /api/admin/feedback`

支持筛选：
- `startDate`
- `endDate`
- `feedbackType`
- `satisfactionValue`
- `page`
- `pageSize`

当前页面展示列：
- 提交时间
- 反馈类型
- 满意度
- 原因标签
- 反馈内容
- 所在页面
- 生成批次 ID

当前前端会对以下字段做中文映射：
- `feedback_type`
  - `satisfaction` -> `满意度反馈`
  - `general` -> `通用建议`
- `satisfaction_value`
  - `satisfied` -> `满意`
  - `unsatisfied` -> `不满意`
- `page_name`
  - `home` -> `首页`
  - `results` -> `结果页`
  - `favorites` -> `我的收藏`
  - `admin` -> `后台管理端`

## 6. 时间显示规则
后台页面中的时间展示已统一为：

```text
2026-03-28 23:09:48
```

适用范围包括：
- 生成记录中的请求时间
- 事件日志中的发生时间
- 收藏中的收藏时间
- 反馈中的提交时间

当前做法是后端优先把时间字段格式化成 `YYYY-MM-DD HH:mm:ss`，前端再做一次兜底格式化，避免直接显示：

```text
Sat Mar 28 2026 23:09:48 GMT+0800 (中国标准时间)
```

相关实现：
- 后端格式化：[server/db.ts](D:/Dev/AI-Project/AI_Username_Generator_3/server/db.ts)
- 前端兜底格式化：[src/AdminApp.tsx](D:/Dev/AI-Project/AI_Username_Generator_3/src/AdminApp.tsx)

## 7. 后台接口定义

### 7.1 登录
- `POST /api/admin/login`

请求体：
- `username`
- `password`

返回：
- `token`
- `expiresAt`
- `username`

### 7.2 总览
- `GET /api/admin/overview`

参数：
- `startDate`
- `endDate`

返回：
- `data.kpi`
- `data.trend`
- `summary`

### 7.3 明细列表
- `GET /api/admin/generations`
- `GET /api/admin/events`
- `GET /api/admin/favorites`
- `GET /api/admin/feedback`

通用返回结构：
- `data`
- `pagination`
- `summary`

### 7.4 导出
- `GET /api/admin/export`

参数：
- `module=overview|generations|events|favorites|feedback`
- 其余筛选参数与对应页面复用

返回：
- `text/csv; charset=utf-8`
- 含 UTF-8 BOM，便于 Excel 打开

说明：
- 页面表头已中文化
- 导出的 CSV 列名当前仍保留英文原始字段名，便于后续脚本处理
- `overview` 导出中会包含一行 `date=SUMMARY` 的汇总行

## 8. 数据来源映射
- `analytics_event_log`
  - 事件日志明细
  - 总览中的曝光、点击生成、生成成功、点击分享、保存海报、复制率、收藏率相关数据
- `analytics_generation_batch`
  - 生成记录明细
  - 平均耗时
- `analytics_generation_result`
  - 复制/收藏计数回填的明细基础
- `user_favorite_name`
  - 收藏记录
- `user_feedback`
  - 用户反馈记录

说明：
- `analytics_metrics_daily` 当前仍是预留聚合表
- 当前后台总览仍以事实表实时查询为主

## 9. 前后端实现文件
- 前端页面：[src/AdminApp.tsx](D:/Dev/AI-Project/AI_Username_Generator_3/src/AdminApp.tsx)
- 前端请求层：[src/admin/service.ts](D:/Dev/AI-Project/AI_Username_Generator_3/src/admin/service.ts)
- 前端类型：[src/admin/types.ts](D:/Dev/AI-Project/AI_Username_Generator_3/src/admin/types.ts)
- 后端管理接口：[server/index.ts](D:/Dev/AI-Project/AI_Username_Generator_3/server/index.ts)
- 后端查询聚合：[server/db.ts](D:/Dev/AI-Project/AI_Username_Generator_3/server/db.ts)

## 10. 本地运行与验证
启动方式：

```bash
npm run server
npm run dev
```

访问地址：

```text
http://localhost:3000/admin
```

建议验证项：
1. 后台登录成功后可进入总览页
2. 五个标签页都能正常加载
3. 日期筛选、分页、手动刷新生效
4. 事件日志中可看到 `click_share`、`save_poster`
5. 所有时间列均为 `YYYY-MM-DD HH:mm:ss`
6. 导出 CSV 可下载且与筛选条件一致
7. 未登录访问 `/api/admin/*`（除 `/api/admin/login` 外）返回 `401`

## 11. 部署与配置说明
- 当前生产环境支持通过 `/admin` 直接访问后台页面
- 前端默认使用同域 `/api/admin/*` 调用后台接口
- 若前后端分域部署，可通过 `VITE_API_BASE_URL` 指向后端域名

后端所需关键环境变量：
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_EXPIRE_HOURS`

## 12. 当前限制
- 后台是只读面板，不支持在页面内修改数据
- 时间范围限制为最多 31 天
- 页面展示字段少于实际返回字段，部分补充信息仅在 CSV 导出中可见
- 当前没有独立的角色权限体系，只有单一管理员账号密码鉴权
