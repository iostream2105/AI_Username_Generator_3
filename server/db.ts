import mysql, { Pool, RowDataPacket } from "mysql2/promise";

export interface FavoriteRecord {
  userKey: string;
  name: string;
  meaningTitle: string;
  meaningDesc: string;
  styleTags: string[];
}

export interface FavoriteItem {
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
}

export interface TrackEventRecord {
  eventId: string;
  userKey: string;
  sessionId: string;
  eventName: string;
  pageName?: string;
  generationId?: string;
  keywordsCount?: number;
  meaningTag?: string;
  styleTag?: string;
  resultRank?: number;
  resultName?: string;
  isSuccess?: boolean;
  latencyMs?: number;
  errorCode?: string;
  properties?: Record<string, unknown>;
}

export interface GenerationBatchStartRecord {
  generationId: string;
  userKey: string;
  sessionId: string;
  keywordsText: string;
  keywordsJson: string[];
  keywordsCount: number;
  meaningTag?: string;
  styleTag?: string;
  modelName?: string;
}

export interface GenerationBatchFinishRecord {
  generationId: string;
  isSuccess: boolean;
  latencyMs?: number;
  errorCode?: string;
  resultCount?: number;
}

export interface GenerationResultRecord {
  generationId: string;
  resultRank: number;
  resultName: string;
  meaningTitle: string;
  meaningDesc: string;
  styleTags: string[];
}

export interface UserFeedbackRecord {
  userKey: string;
  sessionId: string;
  feedbackType: "satisfaction" | "general";
  satisfactionValue?: "satisfied" | "unsatisfied";
  reasonTag?: string;
  content?: string;
  pageName?: string;
  generationId?: string;
}

let pool: Pool | null = null;

// 支持两种配置方式：单连接串（DB_URL/MYSQL_URL）或拆分字段
function resolveDbConfig() {
  const connectionUri = process.env.DB_URL || process.env.MYSQL_URL;
  if (connectionUri) {
    return { uri: connectionUri };
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || 3306);

  if (!host || !user || !database) {
    return null;
  }

  return { host, user, password, database, port };
}

export async function initDb() {
  const config = resolveDbConfig();
  if (!config) {
    return false;
  }

  pool = "uri" in config
    ? mysql.createPool({
        uri: config.uri,
        waitForConnections: true,
        connectionLimit: 10,
      })
    : mysql.createPool({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port,
        waitForConnections: true,
        connectionLimit: 10,
      });

  return true;
}

export function isDbReady() {
  return Boolean(pool);
}

// 查询用户收藏列表（按创建时间倒序）
export async function listFavorites(userKey: string): Promise<FavoriteItem[]> {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        name,
        meaning_title,
        meaning_desc,
        style_tags_json
      FROM user_favorite_name
      WHERE user_key = ?
      ORDER BY created_at DESC
    `,
    [userKey]
  );

  return rows.map((row) => ({
    name: String(row.name || ""),
    meaning_title: String(row.meaning_title || ""),
    meaning_desc: String(row.meaning_desc || ""),
    style_tags: parseStyleTags(row.style_tags_json),
  }));
}

// 收藏写入采用 upsert，避免同一用户同名收藏重复
export async function upsertFavorite(record: FavoriteRecord) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      INSERT INTO user_favorite_name (
        user_key,
        name,
        meaning_title,
        meaning_desc,
        style_tags_json
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        meaning_title = VALUES(meaning_title),
        meaning_desc = VALUES(meaning_desc),
        style_tags_json = VALUES(style_tags_json),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      record.userKey,
      record.name,
      record.meaningTitle,
      record.meaningDesc,
      JSON.stringify(record.styleTags || []),
    ]
  );
}

export async function deleteFavorite(userKey: string, name: string) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      DELETE FROM user_favorite_name
      WHERE user_key = ? AND name = ?
    `,
    [userKey, name]
  );
}

// 通用事件埋点写入（analytics_event_log）
export async function insertAnalyticsEvent(record: TrackEventRecord) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      INSERT INTO analytics_event_log (
        event_id,
        user_key,
        session_id,
        event_name,
        page_name,
        generation_id,
        keywords_count,
        meaning_tag,
        style_tag,
        result_rank,
        result_name,
        is_success,
        latency_ms,
        error_code,
        properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      record.eventId,
      record.userKey || "",
      record.sessionId || "",
      record.eventName,
      record.pageName || "",
      record.generationId || "",
      record.keywordsCount || 0,
      record.meaningTag || "",
      record.styleTag || "",
      record.resultRank ?? null,
      record.resultName || "",
      record.isSuccess === false ? 0 : 1,
      record.latencyMs ?? null,
      record.errorCode || "",
      record.properties ? JSON.stringify(record.properties) : null,
    ]
  );
}

// 生成批次开始记录（若 generation_id 已存在则更新）
export async function upsertGenerationBatchStart(record: GenerationBatchStartRecord) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      INSERT INTO analytics_generation_batch (
        generation_id,
        user_key,
        session_id,
        keywords_text,
        keywords_json,
        keywords_count,
        meaning_tag,
        style_tag,
        requested_at,
        is_success,
        model_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), 1, ?)
      ON DUPLICATE KEY UPDATE
        user_key = VALUES(user_key),
        session_id = VALUES(session_id),
        keywords_text = VALUES(keywords_text),
        keywords_json = VALUES(keywords_json),
        keywords_count = VALUES(keywords_count),
        meaning_tag = VALUES(meaning_tag),
        style_tag = VALUES(style_tag),
        requested_at = CURRENT_TIMESTAMP(3),
        is_success = 1,
        model_name = VALUES(model_name),
        error_code = '',
        result_count = 0
    `,
    [
      record.generationId,
      record.userKey || "",
      record.sessionId || "",
      record.keywordsText,
      JSON.stringify(record.keywordsJson || []),
      record.keywordsCount || 0,
      record.meaningTag || "",
      record.styleTag || "",
      record.modelName || "",
    ]
  );
}

// 生成批次结束记录（成功/失败统一更新）
export async function finishGenerationBatch(record: GenerationBatchFinishRecord) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      UPDATE analytics_generation_batch
      SET
        responded_at = CURRENT_TIMESTAMP(3),
        is_success = ?,
        latency_ms = ?,
        error_code = ?,
        result_count = ?
      WHERE generation_id = ?
    `,
    [
      record.isSuccess ? 1 : 0,
      record.latencyMs ?? null,
      record.errorCode || "",
      record.resultCount || 0,
      record.generationId,
    ]
  );
}

// 批量写入生成结果（按 generation_id + result_rank 幂等更新）
export async function upsertGenerationResults(results: GenerationResultRecord[]) {
  if (!pool || results.length === 0) {
    return;
  }

  for (const item of results) {
    await pool.query(
      `
        INSERT INTO analytics_generation_result (
          generation_id,
          result_rank,
          result_name,
          meaning_title,
          meaning_desc,
          style_tags_json
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          result_name = VALUES(result_name),
          meaning_title = VALUES(meaning_title),
          meaning_desc = VALUES(meaning_desc),
          style_tags_json = VALUES(style_tags_json)
      `,
      [
        item.generationId,
        item.resultRank,
        item.resultName,
        item.meaningTitle || "",
        item.meaningDesc || "",
        JSON.stringify(item.styleTags || []),
      ]
    );
  }
}

// 回填单条结果统计计数（复制/收藏）
export async function bumpGenerationResultCounter(
  generationId: string,
  resultRank: number,
  counter: "copied_count" | "favorited_count"
) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      UPDATE analytics_generation_result
      SET ${counter} = ${counter} + 1
      WHERE generation_id = ? AND result_rank = ?
    `,
    [generationId, resultRank]
  );
}

// 用户反馈入库（满意度与意见反馈共用）
export async function insertUserFeedback(record: UserFeedbackRecord) {
  if (!pool) {
    throw new Error("DB is not initialized");
  }

  await pool.query(
    `
      INSERT INTO user_feedback (
        user_key,
        session_id,
        feedback_type,
        satisfaction_value,
        reason_tag,
        content,
        page_name,
        generation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      record.userKey || "",
      record.sessionId || "",
      record.feedbackType,
      record.satisfactionValue || "",
      record.reasonTag || "",
      record.content || "",
      record.pageName || "",
      record.generationId || "",
    ]
  );
}

// 兼容 MySQL JSON 字段在不同驱动返回类型下的解析差异
function parseStyleTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  if (value && typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return [];
    }
  }
  return [];
}
