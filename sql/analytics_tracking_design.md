# MVP 埋点事件字典（对应 PRD #16）

## 事件命名（event_name）

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
- `trigger_paywall`
- `purchase_completed`

## 推荐写入规则

1. 所有事件先写入 `analytics_event_log`（事实表）。
2. 生成请求额外写入 `analytics_generation_batch`（一次生成一次记录）。
3. 生成成功后将返回的 3 个候选写入 `analytics_generation_result`。
4. 每天离线任务按 `analytics_event_log` 回填 `analytics_metrics_daily`。

## 字段约定

- `user_key`：匿名设备 ID（无登录场景）
- `session_id`：会话 ID（一次启动/一次页面会话）
- `generation_id`：一次生成流程唯一 ID（前后端共享）
- `properties`：事件扩展 JSON（如按钮位置、实验组、页面来源）
  - `properties.name_mode`：生成模式（`cn` / `en` / `mix`）
  - `properties.style_weight`：风格权重（`normal` / `reduced`）
  - `properties.priority`：当前优先级策略（如 `keywords>meaning>style`）

## 指标与表字段映射

- 首页访问量：`event_name = 'home_exposure'`
- 点击生成率：`click_generate / home_exposure`
- 生成成功率：`generate_success / click_generate`
- 结果停留时长：事件 `properties.dwell_sec` 聚合
- 复制率：`click_copy / generate_success`
- 收藏率：`click_favorite / generate_success`
- 换一批率：`click_regenerate / generate_success`
- 二次生成率：同一 `user_key` 在 24h 内 `click_generate` >= 2
- 留存：按 `user_key + 日期` 在次日/7日是否再次出现事件

## 样例 SQL（查询）

```sql
SELECT DATE(event_time) AS dt, COUNT(*) AS pv
FROM analytics_event_log
WHERE event_name = 'home_exposure'
GROUP BY DATE(event_time)
ORDER BY dt DESC;
```

```sql
SELECT DATE(event_time) AS dt,
  SUM(event_name='click_generate') / NULLIF(SUM(event_name='home_exposure'), 0) AS click_generate_rate
FROM analytics_event_log
GROUP BY DATE(event_time)
ORDER BY dt DESC;
```

