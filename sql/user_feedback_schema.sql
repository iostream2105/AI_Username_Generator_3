-- User feedback table for MVP feedback loop

CREATE TABLE IF NOT EXISTS user_feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_key VARCHAR(128) NOT NULL DEFAULT '',
  session_id VARCHAR(128) NOT NULL DEFAULT '',
  feedback_type VARCHAR(32) NOT NULL DEFAULT '',
  satisfaction_value VARCHAR(32) NOT NULL DEFAULT '',
  reason_tag VARCHAR(64) NOT NULL DEFAULT '',
  content VARCHAR(1000) NOT NULL DEFAULT '',
  page_name VARCHAR(64) NOT NULL DEFAULT '',
  generation_id VARCHAR(64) NOT NULL DEFAULT '',
  _openid VARCHAR(64) DEFAULT '' NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_time (user_key, created_at),
  KEY idx_type_time (feedback_type, created_at),
  KEY idx_generation_id (generation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
