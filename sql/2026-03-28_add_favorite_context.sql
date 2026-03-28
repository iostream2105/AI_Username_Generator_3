-- 为收藏记录补充分享海报所需的输入上下文字段
ALTER TABLE user_favorite_name
  ADD COLUMN generation_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '来源生成流程ID' AFTER style_tags_json,
  ADD COLUMN favorite_keywords_json JSON NULL COMMENT '收藏时的输入关键词JSON' AFTER generation_id,
  ADD COLUMN favorite_meaning VARCHAR(64) NOT NULL DEFAULT '' COMMENT '收藏时的寓意方向' AFTER favorite_keywords_json,
  ADD COLUMN favorite_name_mode VARCHAR(16) NOT NULL DEFAULT 'cn' COMMENT '收藏时的生成模式' AFTER favorite_meaning,
  ADD KEY idx_generation_id (generation_id);

-- 利用既有 click_favorite 埋点回填 generation_id 与 name_mode
UPDATE user_favorite_name AS favorite
JOIN (
  SELECT
    user_key,
    result_name,
    SUBSTRING_INDEX(GROUP_CONCAT(generation_id ORDER BY event_time DESC), ',', 1) AS generation_id,
    SUBSTRING_INDEX(
      GROUP_CONCAT(JSON_UNQUOTE(JSON_EXTRACT(properties, '$.name_mode')) ORDER BY event_time DESC),
      ',',
      1
    ) AS favorite_name_mode
  FROM analytics_event_log
  WHERE event_name = 'click_favorite'
    AND user_key <> ''
    AND result_name <> ''
    AND generation_id <> ''
  GROUP BY user_key, result_name
) AS event_match
  ON event_match.user_key = favorite.user_key
 AND event_match.result_name = favorite.name
SET
  favorite.generation_id = IF(favorite.generation_id = '', event_match.generation_id, favorite.generation_id),
  favorite.favorite_name_mode = IF(
    favorite.favorite_name_mode = '' OR favorite.favorite_name_mode IS NULL,
    COALESCE(NULLIF(event_match.favorite_name_mode, ''), 'cn'),
    favorite.favorite_name_mode
  )
WHERE favorite.generation_id = ''
   OR favorite.favorite_name_mode = ''
   OR favorite.favorite_name_mode IS NULL;

-- 根据 generation_id 回填关键词与寓意方向
UPDATE user_favorite_name AS favorite
JOIN analytics_generation_batch AS batch
  ON batch.generation_id = favorite.generation_id
SET
  favorite.favorite_keywords_json = IF(favorite.favorite_keywords_json IS NULL, batch.keywords_json, favorite.favorite_keywords_json),
  favorite.favorite_meaning = IF(favorite.favorite_meaning = '', batch.meaning_tag, favorite.favorite_meaning)
WHERE favorite.generation_id <> ''
  AND (favorite.favorite_keywords_json IS NULL OR favorite.favorite_meaning = '');
