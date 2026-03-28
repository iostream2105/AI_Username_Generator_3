import mysql, { Pool, RowDataPacket } from "mysql2/promise";

// ------------------------------
// App 端写操作数据结构
// ------------------------------
export interface FavoriteRecord {
  userKey: string;
  name: string;
  meaningTitle: string;
  meaningDesc: string;
  styleTags: string[];
  generationId?: string;
  favoriteKeywords?: string[];
  favoriteMeaning?: string;
  favoriteNameMode?: "cn" | "en" | "mix";
}

export interface FavoriteItem {
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  generation_id?: string;
  favorite_keywords?: string[];
  favorite_meaning?: string;
  favorite_name_mode?: "cn" | "en" | "mix";
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

// ------------------------------
// 后台管理端查询结构
// ------------------------------
export interface AdminDateRange {
  startDate: string;
  endDateExclusive: string;
}

export interface AdminPagination {
  page: number;
  pageSize: number;
}

export interface AdminPaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminListResult<T> {
  rows: T[];
  pagination: AdminPaginationResult;
}

export interface AdminOverviewKpi {
  home_exposure: number;
  click_generate: number;
  generate_success: number;
  generate_success_rate: number;
  copy_rate: number;
  favorite_rate: number;
  avg_latency_ms: number;
}

export interface AdminOverviewTrend {
  date: string;
  home_exposure: number;
  click_generate: number;
  generate_success: number;
  generate_success_rate: number;
  copy_rate: number;
  favorite_rate: number;
  avg_latency_ms: number;
}

export interface AdminOverviewResult {
  kpi: AdminOverviewKpi;
  trend: AdminOverviewTrend[];
}

export interface AdminGenerationRow {
  generation_id: string;
  user_key: string;
  session_id: string;
  keywords_text: string;
  keywords_count: number;
  meaning_tag: string;
  style_tag: string;
  requested_at: string;
  responded_at: string;
  is_success: boolean;
  latency_ms: number;
  model_name: string;
  error_code: string;
  result_count: number;
}

export interface AdminEventRow {
  event_id: string;
  user_key: string;
  session_id: string;
  event_name: string;
  event_time: string;
  page_name: string;
  generation_id: string;
  keywords_count: number;
  meaning_tag: string;
  style_tag: string;
  result_rank: number;
  result_name: string;
  is_success: boolean;
  latency_ms: number;
  error_code: string;
  properties: Record<string, unknown> | null;
}

export interface AdminFavoriteRow {
  user_key: string;
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  generation_id: string;
  favorite_keywords: string[];
  favorite_meaning: string;
  favorite_name_mode: string;
  created_at: string;
  updated_at: string;
}

export interface AdminFeedbackRow {
  user_key: string;
  session_id: string;
  feedback_type: string;
  satisfaction_value: string;
  reason_tag: string;
  content: string;
  page_name: string;
  generation_id: string;
  created_at: string;
}

export interface AdminGenerationFilters {
  dateRange: AdminDateRange;
  pagination: AdminPagination;
  isSuccess?: boolean;
  meaningTag?: string;
  styleTag?: string;
}

export interface AdminEventFilters {
  dateRange: AdminDateRange;
  pagination: AdminPagination;
  eventName?: string;
  generationId?: string;
}

export interface AdminFavoriteFilters {
  dateRange: AdminDateRange;
  pagination: AdminPagination;
  userKey?: string;
  name?: string;
}

export interface AdminFeedbackFilters {
  dateRange: AdminDateRange;
  pagination: AdminPagination;
  feedbackType?: string;
  satisfactionValue?: string;
}

let pool: Pool | null = null;

const FAVORITE_CONTEXT_COLUMNS = {
  generation_id: "ADD COLUMN generation_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '来源生成流程ID' AFTER style_tags_json",
  favorite_keywords_json: "ADD COLUMN favorite_keywords_json JSON NULL COMMENT '收藏时的输入关键词JSON' AFTER generation_id",
  favorite_meaning: "ADD COLUMN favorite_meaning VARCHAR(64) NOT NULL DEFAULT '' COMMENT '收藏时的寓意方向' AFTER favorite_keywords_json",
  favorite_name_mode: "ADD COLUMN favorite_name_mode VARCHAR(16) NOT NULL DEFAULT 'cn' COMMENT '收藏时的生成模式' AFTER favorite_meaning",
} as const;

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

// 初始化连接池：
// - 仅负责建立连接配置，不在此处探活查询
// - 返回 false 表示“配置缺失”，由上层决定是否继续启动服务
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

  await ensureFavoriteContextSchema(pool);

  return true;
}

// 供上层快速判断数据库是否可用（例如接口返回 503）
export function isDbReady() {
  return Boolean(pool);
}

// 统一获取数据库连接池，避免每个函数重复判空逻辑
function getDb() {
  if (!pool) {
    throw new Error("DB is not initialized");
  }
  return pool;
}

async function ensureFavoriteContextSchema(db: Pool) {
  const [columnRows] = await db.query<RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_favorite_name'
    `
  );

  if (columnRows.length === 0) {
    return;
  }

  const existingColumns = new Set(columnRows.map((row) => String(row.COLUMN_NAME || "")));
  const alterParts: string[] = [];

  for (const [columnName, statement] of Object.entries(FAVORITE_CONTEXT_COLUMNS)) {
    if (!existingColumns.has(columnName)) {
      alterParts.push(statement);
    }
  }

  const [indexRows] = await db.query<RowDataPacket[]>(
    `
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_favorite_name'
        AND INDEX_NAME = 'idx_generation_id'
    `
  );

  if (indexRows.length === 0) {
    alterParts.push("ADD KEY idx_generation_id (generation_id)");
  }

  if (alterParts.length > 0) {
    await db.query(`ALTER TABLE user_favorite_name ${alterParts.join(", ")}`);
  }

  await backfillFavoriteContext(db);
}

async function backfillFavoriteContext(db: Pool) {
  try {
    await db.query(
      `
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
           OR favorite.favorite_name_mode IS NULL
      `
    );

    await db.query(
      `
        UPDATE user_favorite_name AS favorite
        JOIN analytics_generation_batch AS batch
          ON batch.generation_id = favorite.generation_id
        SET
          favorite.favorite_keywords_json = IF(
            favorite.favorite_keywords_json IS NULL,
            batch.keywords_json,
            favorite.favorite_keywords_json
          ),
          favorite.favorite_meaning = IF(
            favorite.favorite_meaning = '',
            batch.meaning_tag,
            favorite.favorite_meaning
          )
        WHERE favorite.generation_id <> ''
          AND (favorite.favorite_keywords_json IS NULL OR favorite.favorite_meaning = '')
      `
    );
  } catch (error: any) {
    console.warn("Favorite context backfill skipped:", error?.message || error);
  }
}

// 统一分页返回结构：
// - totalPages 至少为 1，前端分页组件无需额外判零
function calcPaginationResult(total: number, pagination: AdminPagination): AdminPaginationResult {
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / pagination.pageSize));
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: safeTotal,
    totalPages,
  };
}

// 安全除法：分母为 0 时返回 0，避免 NaN 污染统计结果
function safeDivide(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(4));
}

// 生成 [startDate, endDateExclusive) 的自然日数组，用于补齐“无数据日期”
function dayRange(startDate: string, endDateExclusive: string) {
  const result: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDateExclusive}T00:00:00.000Z`);
  while (cursor < end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// 归一化 SQL 日期：
// mysql2 在不同配置下可能返回 Date 或字符串，这里统一转 YYYY-MM-DD
function normalizeSqlDate(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value);
  const matched = text.match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : text.slice(0, 10);
}

// 安全解析 JSON 对象字段（例如 properties），解析失败不抛错直接返回 null
function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

// 后台总览：
// 1) 从事实事件表聚合曝光/点击/成功/复制/收藏
// 2) 从生成批次表聚合平均耗时
// 3) 生成按天趋势并补齐空白日期，最终按日期倒序返回
export async function getAdminOverview(dateRange: AdminDateRange): Promise<AdminOverviewResult> {
  const db = getDb();
  const [summaryRows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        SUM(event_name = 'home_exposure') AS home_exposure,
        SUM(event_name = 'click_generate') AS click_generate,
        SUM(event_name = 'generate_success' AND is_success = 1) AS generate_success,
        SUM(event_name = 'click_copy') AS click_copy,
        SUM(event_name = 'click_favorite') AS click_favorite
      FROM analytics_event_log
      WHERE event_time >= ? AND event_time < ?
    `,
    [dateRange.startDate, dateRange.endDateExclusive]
  );

  const [latencySummaryRows] = await db.query<RowDataPacket[]>(
    `
      SELECT AVG(latency_ms) AS avg_latency_ms
      FROM analytics_generation_batch
      WHERE requested_at >= ? AND requested_at < ? AND is_success = 1
    `,
    [dateRange.startDate, dateRange.endDateExclusive]
  );

  const summary = (summaryRows[0] || {}) as RowDataPacket;
  const avgLatency = Number(latencySummaryRows[0]?.avg_latency_ms || 0);
  const homeExposure = Number(summary.home_exposure || 0);
  const clickGenerate = Number(summary.click_generate || 0);
  const generateSuccess = Number(summary.generate_success || 0);
  const clickCopy = Number(summary.click_copy || 0);
  const clickFavorite = Number(summary.click_favorite || 0);

  const [eventTrendRows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        DATE_FORMAT(event_time, '%Y-%m-%d') AS stat_date,
        SUM(event_name = 'home_exposure') AS home_exposure,
        SUM(event_name = 'click_generate') AS click_generate,
        SUM(event_name = 'generate_success' AND is_success = 1) AS generate_success,
        SUM(event_name = 'click_copy') AS click_copy,
        SUM(event_name = 'click_favorite') AS click_favorite
      FROM analytics_event_log
      WHERE event_time >= ? AND event_time < ?
      GROUP BY DATE_FORMAT(event_time, '%Y-%m-%d')
      ORDER BY stat_date ASC
    `,
    [dateRange.startDate, dateRange.endDateExclusive]
  );

  const [latencyTrendRows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        DATE_FORMAT(requested_at, '%Y-%m-%d') AS stat_date,
        AVG(latency_ms) AS avg_latency_ms
      FROM analytics_generation_batch
      WHERE requested_at >= ? AND requested_at < ? AND is_success = 1
      GROUP BY DATE_FORMAT(requested_at, '%Y-%m-%d')
      ORDER BY stat_date ASC
    `,
    [dateRange.startDate, dateRange.endDateExclusive]
  );

  const eventTrendMap = new Map<string, RowDataPacket>();
  eventTrendRows.forEach((row) => {
    eventTrendMap.set(normalizeSqlDate(row.stat_date), row);
  });
  const latencyTrendMap = new Map<string, number>();
  latencyTrendRows.forEach((row) => {
    latencyTrendMap.set(normalizeSqlDate(row.stat_date), Number(row.avg_latency_ms || 0));
  });

  const trend: AdminOverviewTrend[] = dayRange(dateRange.startDate, dateRange.endDateExclusive).map((date) => {
    const eventRow = eventTrendMap.get(date);
    const home = Number(eventRow?.home_exposure || 0);
    const click = Number(eventRow?.click_generate || 0);
    const success = Number(eventRow?.generate_success || 0);
    const copy = Number(eventRow?.click_copy || 0);
    const favorite = Number(eventRow?.click_favorite || 0);
    return {
      date,
      home_exposure: home,
      click_generate: click,
      generate_success: success,
      generate_success_rate: safeDivide(success, click),
      copy_rate: safeDivide(copy, success),
      favorite_rate: safeDivide(favorite, success),
      avg_latency_ms: Number((latencyTrendMap.get(date) || 0).toFixed(2)),
    };
  }).reverse();

  return {
    kpi: {
      home_exposure: homeExposure,
      click_generate: clickGenerate,
      generate_success: generateSuccess,
      generate_success_rate: safeDivide(generateSuccess, clickGenerate),
      copy_rate: safeDivide(clickCopy, generateSuccess),
      favorite_rate: safeDivide(clickFavorite, generateSuccess),
      avg_latency_ms: Number(avgLatency.toFixed(2)),
    },
    trend,
  };
}

// 后台-生成记录查询：
// - 支持成功状态、寓意、风格过滤
// - 先 count 再分页查询，保证前端可展示完整分页信息
export async function listAdminGenerations(filters: AdminGenerationFilters): Promise<AdminListResult<AdminGenerationRow>> {
  const db = getDb();
  const where: string[] = ["requested_at >= ?", "requested_at < ?"];
  const params: Array<string | number> = [filters.dateRange.startDate, filters.dateRange.endDateExclusive];
  if (typeof filters.isSuccess === "boolean") {
    where.push("is_success = ?");
    params.push(filters.isSuccess ? 1 : 0);
  }
  if (filters.meaningTag) {
    where.push("meaning_tag = ?");
    params.push(filters.meaningTag);
  }
  if (filters.styleTag) {
    where.push("style_tag = ?");
    params.push(filters.styleTag);
  }
  const whereSql = where.join(" AND ");

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM analytics_generation_batch WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const offset = (filters.pagination.page - 1) * filters.pagination.pageSize;

  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        generation_id,
        user_key,
        session_id,
        keywords_text,
        keywords_count,
        meaning_tag,
        style_tag,
        requested_at,
        responded_at,
        is_success,
        latency_ms,
        model_name,
        error_code,
        result_count
      FROM analytics_generation_batch
      WHERE ${whereSql}
      ORDER BY requested_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pagination.pageSize, offset]
  );

  return {
    rows: rows.map((row) => ({
      generation_id: String(row.generation_id || ""),
      user_key: String(row.user_key || ""),
      session_id: String(row.session_id || ""),
      keywords_text: String(row.keywords_text || ""),
      keywords_count: Number(row.keywords_count || 0),
      meaning_tag: String(row.meaning_tag || ""),
      style_tag: String(row.style_tag || ""),
      requested_at: String(row.requested_at || ""),
      responded_at: String(row.responded_at || ""),
      is_success: Number(row.is_success || 0) === 1,
      latency_ms: Number(row.latency_ms || 0),
      model_name: String(row.model_name || ""),
      error_code: String(row.error_code || ""),
      result_count: Number(row.result_count || 0),
    })),
    pagination: calcPaginationResult(total, filters.pagination),
  };
}

// 后台-事件日志查询：
// - 支持 eventName 与 generationId 过滤
// - properties 字段做安全解析，避免脏数据导致接口失败
export async function listAdminEvents(filters: AdminEventFilters): Promise<AdminListResult<AdminEventRow>> {
  const db = getDb();
  const where: string[] = ["event_time >= ?", "event_time < ?"];
  const params: Array<string | number> = [filters.dateRange.startDate, filters.dateRange.endDateExclusive];
  if (filters.eventName) {
    where.push("event_name = ?");
    params.push(filters.eventName);
  }
  if (filters.generationId) {
    where.push("generation_id = ?");
    params.push(filters.generationId);
  }
  const whereSql = where.join(" AND ");

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM analytics_event_log WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const offset = (filters.pagination.page - 1) * filters.pagination.pageSize;

  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        event_id,
        user_key,
        session_id,
        event_name,
        event_time,
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
      FROM analytics_event_log
      WHERE ${whereSql}
      ORDER BY event_time DESC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pagination.pageSize, offset]
  );

  return {
    rows: rows.map((row) => ({
      event_id: String(row.event_id || ""),
      user_key: String(row.user_key || ""),
      session_id: String(row.session_id || ""),
      event_name: String(row.event_name || ""),
      event_time: String(row.event_time || ""),
      page_name: String(row.page_name || ""),
      generation_id: String(row.generation_id || ""),
      keywords_count: Number(row.keywords_count || 0),
      meaning_tag: String(row.meaning_tag || ""),
      style_tag: String(row.style_tag || ""),
      result_rank: Number(row.result_rank || 0),
      result_name: String(row.result_name || ""),
      is_success: Number(row.is_success || 0) === 1,
      latency_ms: Number(row.latency_ms || 0),
      error_code: String(row.error_code || ""),
      properties: parseJsonObject(row.properties),
    })),
    pagination: calcPaginationResult(total, filters.pagination),
  };
}

// 后台-收藏列表查询：
// - userKey/name 使用 LIKE，便于模糊检索
// - style_tags_json 统一解析为 string[]
export async function listAdminFavorites(filters: AdminFavoriteFilters): Promise<AdminListResult<AdminFavoriteRow>> {
  const db = getDb();
  const where: string[] = ["created_at >= ?", "created_at < ?"];
  const params: Array<string | number> = [filters.dateRange.startDate, filters.dateRange.endDateExclusive];
  if (filters.userKey) {
    where.push("user_key LIKE ?");
    params.push(`%${filters.userKey}%`);
  }
  if (filters.name) {
    where.push("name LIKE ?");
    params.push(`%${filters.name}%`);
  }
  const whereSql = where.join(" AND ");

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM user_favorite_name WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const offset = (filters.pagination.page - 1) * filters.pagination.pageSize;

  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        user_key,
        name,
        meaning_title,
        meaning_desc,
        style_tags_json,
        generation_id,
        favorite_keywords_json,
        favorite_meaning,
        favorite_name_mode,
        created_at,
        updated_at
      FROM user_favorite_name
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pagination.pageSize, offset]
  );

  return {
    rows: rows.map((row) => ({
      user_key: String(row.user_key || ""),
      name: String(row.name || ""),
      meaning_title: String(row.meaning_title || ""),
      meaning_desc: String(row.meaning_desc || ""),
      style_tags: parseStyleTags(row.style_tags_json),
      generation_id: String(row.generation_id || ""),
      favorite_keywords: parseStyleTags(row.favorite_keywords_json),
      favorite_meaning: String(row.favorite_meaning || ""),
      favorite_name_mode: parseFavoriteNameMode(row.favorite_name_mode),
      created_at: String(row.created_at || ""),
      updated_at: String(row.updated_at || ""),
    })),
    pagination: calcPaginationResult(total, filters.pagination),
  };
}

// 后台-反馈列表查询：
// - 支持反馈类型与满意度过滤
// - 统一按创建时间倒序，优先展示最新用户反馈
export async function listAdminFeedback(filters: AdminFeedbackFilters): Promise<AdminListResult<AdminFeedbackRow>> {
  const db = getDb();
  const where: string[] = ["created_at >= ?", "created_at < ?"];
  const params: Array<string | number> = [filters.dateRange.startDate, filters.dateRange.endDateExclusive];
  if (filters.feedbackType) {
    where.push("feedback_type = ?");
    params.push(filters.feedbackType);
  }
  if (filters.satisfactionValue) {
    where.push("satisfaction_value = ?");
    params.push(filters.satisfactionValue);
  }
  const whereSql = where.join(" AND ");

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM user_feedback WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const offset = (filters.pagination.page - 1) * filters.pagination.pageSize;

  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        user_key,
        session_id,
        feedback_type,
        satisfaction_value,
        reason_tag,
        content,
        page_name,
        generation_id,
        created_at
      FROM user_feedback
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pagination.pageSize, offset]
  );

  return {
    rows: rows.map((row) => ({
      user_key: String(row.user_key || ""),
      session_id: String(row.session_id || ""),
      feedback_type: String(row.feedback_type || ""),
      satisfaction_value: String(row.satisfaction_value || ""),
      reason_tag: String(row.reason_tag || ""),
      content: String(row.content || ""),
      page_name: String(row.page_name || ""),
      generation_id: String(row.generation_id || ""),
      created_at: String(row.created_at || ""),
    })),
    pagination: calcPaginationResult(total, filters.pagination),
  };
}

// 查询用户收藏列表（按创建时间倒序）
export async function listFavorites(userKey: string): Promise<FavoriteItem[]> {
  const db = getDb();

  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT
        name,
        meaning_title,
        meaning_desc,
        style_tags_json,
        generation_id,
        favorite_keywords_json,
        favorite_meaning,
        favorite_name_mode
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
    generation_id: String(row.generation_id || ""),
    favorite_keywords: parseStyleTags(row.favorite_keywords_json),
    favorite_meaning: String(row.favorite_meaning || ""),
    favorite_name_mode: parseFavoriteNameMode(row.favorite_name_mode),
  }));
}

// 收藏写入采用 upsert，避免同一用户同名收藏重复
export async function upsertFavorite(record: FavoriteRecord) {
  const db = getDb();

  await db.query(
    `
      INSERT INTO user_favorite_name (
        user_key,
        name,
        meaning_title,
        meaning_desc,
        style_tags_json,
        generation_id,
        favorite_keywords_json,
        favorite_meaning,
        favorite_name_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        meaning_title = VALUES(meaning_title),
        meaning_desc = VALUES(meaning_desc),
        style_tags_json = VALUES(style_tags_json),
        generation_id = VALUES(generation_id),
        favorite_keywords_json = VALUES(favorite_keywords_json),
        favorite_meaning = VALUES(favorite_meaning),
        favorite_name_mode = VALUES(favorite_name_mode),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      record.userKey,
      record.name,
      record.meaningTitle,
      record.meaningDesc,
      JSON.stringify(record.styleTags || []),
      record.generationId || "",
      JSON.stringify(record.favoriteKeywords || []),
      record.favoriteMeaning || "",
      record.favoriteNameMode || "cn",
    ]
  );
}

// 删除单条收藏（按 userKey + name 作为逻辑唯一键）
export async function deleteFavorite(userKey: string, name: string) {
  const db = getDb();

  await db.query(
    `
      DELETE FROM user_favorite_name
      WHERE user_key = ? AND name = ?
    `,
    [userKey, name]
  );
}

// 通用事件埋点写入（analytics_event_log）
export async function insertAnalyticsEvent(record: TrackEventRecord) {
  const db = getDb();

  await db.query(
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
  const db = getDb();

  await db.query(
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
  const db = getDb();

  await db.query(
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
  if (results.length === 0) {
    return;
  }
  const db = getDb();

  for (const item of results) {
    await db.query(
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
  const db = getDb();

  await db.query(
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
  const db = getDb();

  await db.query(
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

// 兼容 MySQL JSON 字段在不同驱动返回类型下的解析差异：
// - 可能是数组、字符串、对象，统一收敛为 string[]
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

function parseFavoriteNameMode(value: unknown): "cn" | "en" | "mix" {
  const normalized = String(value || "").trim();
  if (normalized === "en" || normalized === "mix") {
    return normalized;
  }
  return "cn";
}
