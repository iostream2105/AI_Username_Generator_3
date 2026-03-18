-- Favorites table for user-level collection persistence

CREATE TABLE IF NOT EXISTS user_favorite_name (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_key VARCHAR(128) NOT NULL DEFAULT '',
  name VARCHAR(64) NOT NULL,
  meaning_title VARCHAR(128) NOT NULL DEFAULT '',
  meaning_desc VARCHAR(512) NOT NULL DEFAULT '',
  style_tags_json JSON NULL,
  _openid VARCHAR(64) DEFAULT '' NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_name (user_key, name),
  KEY idx_user_created (user_key, created_at),
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
