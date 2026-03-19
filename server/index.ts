import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import {
  AdminFeedbackFilters,
  AdminFavoriteFilters,
  AdminGenerationFilters,
  AdminOverviewTrend,
  AdminPagination,
  bumpGenerationResultCounter,
  deleteFavorite,
  finishGenerationBatch,
  initDb,
  insertUserFeedback,
  getAdminOverview,
  insertAnalyticsEvent,
  isDbReady,
  listAdminEvents,
  listAdminFavorites,
  listAdminFeedback,
  listAdminGenerations,
  listFavorites,
  upsertFavorite,
  upsertGenerationBatchStart,
  upsertGenerationResults,
} from "./db";

dotenv.config({ path: ".env.local" });

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const ADMIN_LOCAL_ONLY = process.env.ADMIN_LOCAL_ONLY !== "false";

// 开发环境放行私网来源，便于手机同局域网调试；生产仍按白名单校验
function isPrivateNetworkOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        (!isProduction && isPrivateNetworkOrigin(origin))
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

const MODEL_NAME = "doubao-seed-1-8-251228";

const client = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

interface GenerateBody {
  keywords: string;
  meaning?: string;
  style?: string;
  userKey?: string;
  sessionId?: string;
  generationId?: string;
}

interface FavoriteBody {
  userKey: string;
  item: {
    name: string;
    meaning_title: string;
    meaning_desc: string;
    style_tags: string[];
  };
}

interface FavoriteDeleteBody {
  userKey: string;
  name: string;
}

interface TrackEventBody {
  event_id?: string;
  user_key?: string;
  session_id?: string;
  event_name?: string;
  page_name?: string;
  generation_id?: string;
  keywords_count?: number;
  meaning_tag?: string;
  style_tag?: string;
  result_rank?: number;
  result_name?: string;
  is_success?: boolean;
  latency_ms?: number;
  error_code?: string;
  properties?: Record<string, unknown>;
}

interface FeedbackBody {
  userKey?: string;
  sessionId?: string;
  feedbackType?: "satisfaction" | "general";
  satisfactionValue?: "satisfied" | "unsatisfied";
  reasonTag?: string;
  content?: string;
  pageName?: string;
  generationId?: string;
}

interface NameItem {
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
}

// 使用 JSON Schema 约束模型输出，降低非结构化返回概率
const NAME_ITEMS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "meaning_title", "meaning_desc", "style_tags"],
        properties: {
          name: { type: "string" },
          meaning_title: { type: "string" },
          meaning_desc: { type: "string" },
          style_tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
};

// 生成简单随机 ID，用于事件ID/生成ID 等链路关联
function createEventId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// 将关键词字符串拆分为数组，统一逗号/空格/中文顿号等分隔符
function splitKeywords(raw: string) {
  return raw
    .split(/[,\s，、]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// 解析前做轻度清洗：仅处理尾逗号等常见 JSON 污点，避免篡改字符串内容
function safeJsonParse(raw: string): unknown {
  const normalized = raw
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(normalized);
}

// 模型响应容错解析：支持纯 JSON、代码块 JSON、文本中数组片段
function parseNameItems(text: string): NameItem[] {
  const trimmed = String(text || "").trim();
  const candidates: string[] = [];

  if (trimmed) {
    candidates.push(trimmed);
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) {
    candidates.push(codeBlockMatch[1].trim());
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = safeJsonParse(candidate);
      const arrayData = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)
          ? (parsed as any).items
          : null;

      if (!arrayData) continue;

      const normalizedItems = arrayData
        .map((item: any) => ({
          name: String(item?.name || "").trim(),
          meaning_title: String(item?.meaning_title || "").trim(),
          meaning_desc: String(item?.meaning_desc || "").trim(),
          style_tags: Array.isArray(item?.style_tags) ? item.style_tags.map((x: unknown) => String(x)) : [],
        }))
        .filter((item: NameItem) => item.name.length > 0);

      if (normalizedItems.length > 0) {
        return normalizedItems.slice(0, 3);
      }
    } catch {
      continue;
    }
  }

  throw new Error("INVALID_MODEL_JSON");
}

function normalizeNameItems(raw: any): NameItem[] {
  if (!Array.isArray(raw)) {
    throw new Error("INVALID_MODEL_JSON");
  }

  const normalizedItems = raw
    .map((item: any) => ({
      name: String(item?.name || "").trim(),
      meaning_title: String(item?.meaning_title || "").trim(),
      meaning_desc: String(item?.meaning_desc || "").trim(),
      style_tags: Array.isArray(item?.style_tags) ? item.style_tags.map((x: unknown) => String(x)) : [],
    }))
    .filter((item: NameItem) => item.name.length > 0);

  if (normalizedItems.length === 0) {
    throw new Error("INVALID_MODEL_JSON");
  }

  return normalizedItems.slice(0, 3);
}

// 埋点/统计写库的安全包装：失败只记日志，不阻断主业务流程
async function safeTrack(task: () => Promise<void>, label: string) {
  if (!isDbReady()) return;
  try {
    await task();
  } catch (e: any) {
    console.error(`${label} failed:`, e?.message || e);
  }
}

// 封装模型请求，便于主流程做重试与降级
async function requestModelContent(prompt: string, temperature = 0.8): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "name_items_response",
        schema: NAME_ITEMS_SCHEMA as any,
        strict: true,
      },
    } as any,
    thinking: { type: "disabled" },
  } as any);

  return completion.choices[0]?.message?.content || "";
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseHostnameFromHostHeader(hostHeader: string | undefined) {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0]?.trim().toLowerCase() || "";
}

function isLocalAdminRequest(req: express.Request) {
  const hostName = parseHostnameFromHostHeader(req.headers.host);
  if (!isLoopbackHost(hostName)) {
    return false;
  }

  const origin = String(req.headers.origin || "").trim();
  if (!origin) {
    return true;
  }

  try {
    const originHost = new URL(origin).hostname.toLowerCase();
    return isLoopbackHost(originHost);
  } catch {
    return false;
  }
}

function parseDateInput(value: unknown) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "";
  return raw;
}

function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function resolveDateRange(query: Record<string, unknown>) {
  const endDateInput = parseDateInput(query.endDate);
  const startDateInput = parseDateInput(query.startDate);

  const todayUtc = new Date();
  const defaultEnd = formatDateUTC(todayUtc);
  const defaultStart = formatDateUTC(addDays(todayUtc, -6));

  const endDate = endDateInput || defaultEnd;
  const startDate = startDateInput || defaultStart;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (start > end) {
    throw new Error("startDate must be less than or equal to endDate");
  }

  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days > 31) {
    throw new Error("date range must be within 31 days");
  }

  return {
    startDate,
    endDate,
    endDateExclusive: formatDateUTC(addDays(end, 1)),
  };
}

function resolvePagination(query: Record<string, unknown>): AdminPagination {
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10) || 1);
  const pageSizeRaw = Number.parseInt(String(query.pageSize || "20"), 10) || 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  return { page, pageSize };
}

function stringQuery(query: Record<string, unknown>, key: string) {
  return String(query[key] || "").trim();
}

function parseBooleanQuery(query: Record<string, unknown>, key: string): boolean | undefined {
  const raw = String(query[key] || "").trim().toLowerCase();
  if (!raw) return undefined;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return undefined;
}

function toPercent(value: number) {
  return Number((value * 100).toFixed(2));
}

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, "\"\"")}"`;
}

function toCsv(columns: string[], rows: Array<Record<string, unknown>>) {
  const header = columns.map(csvCell).join(",");
  const lines = rows.map((row) => columns.map((col) => csvCell(row[col])).join(","));
  return `\uFEFF${[header, ...lines].join("\n")}`;
}

function sendCsv(res: express.Response, fileName: string, csvContent: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.send(csvContent);
}

app.use("/api/admin", (req, res, next) => {
  if (!ADMIN_LOCAL_ONLY) {
    next();
    return;
  }
  if (isLocalAdminRequest(req)) {
    next();
    return;
  }
  res.status(403).json({ error: "Admin API is restricted to localhost" });
});

app.post("/api/generate", async (req, res) => {
  const {
    keywords,
    meaning,
    style,
    userKey = "",
    sessionId = "",
    generationId,
  } = req.body as GenerateBody;

  if (!keywords) {
    res.status(400).json({ error: "keywords is required" });
    return;
  }

  const requestStartedAt = Date.now();
  const resolvedGenerationId = generationId || createEventId("gen");
  const keywordList = splitKeywords(keywords);

  const prompt = `你是一个资深的起名专家和文学创作者，擅长根据用户的关键词、期望寓意和偏好风格，创作出有内涵、有美感、不俗气的网名。

用户输入：
- 关键词（必填）：${keywords}
- 期望寓意（选填）：${meaning || "无特定期望"}
- 偏好风格（选填）：${style || "无特定风格"}

要求：
1. 生成3个网名。
2. 名字要简短（2-4个字为主）。
3. 避免低俗、土味、营销号感。
4. 名字要符合用户的关键词，并结合期望寓意和风格进行升华。

请严格返回 JSON 对象，格式如下，不要包含任何其他文字：
{
  "items": [
    {
      "name": "网名",
      "meaning_title": "寓意标题（如：自由与成长感）",
      "meaning_desc": "一句话寓意解释（解释名字由哪些意象和情绪构成，以及适合什么表达）",
      "style_tags": ["风格标签1", "风格标签2"]
    }
  ]
}`;

  try {
    await safeTrack(
      () =>
        upsertGenerationBatchStart({
          generationId: resolvedGenerationId,
          userKey,
          sessionId,
          keywordsText: keywords,
          keywordsJson: keywordList,
          keywordsCount: keywordList.length,
          meaningTag: meaning || "",
          styleTag: style || "",
          modelName: MODEL_NAME,
        }),
      "upsertGenerationBatchStart"
    );

    await safeTrack(
      () =>
        insertAnalyticsEvent({
          eventId: createEventId("evt"),
          userKey,
          sessionId,
          eventName: "click_generate",
          pageName: "home",
          generationId: resolvedGenerationId,
          keywordsCount: keywordList.length,
          meaningTag: meaning || "",
          styleTag: style || "",
          isSuccess: true,
        }),
      "insert click_generate"
    );

    // 优先模型结构化输出，若解析失败则二次重试一次（严格格式约束）
    let items: NameItem[] = [];
    let parseRetry = false;

    try {
      const text = await requestModelContent(prompt, 0.8);
      try {
        const parsed = safeJsonParse(text) as any;
        items = normalizeNameItems(parsed?.items);
      } catch (parseError) {
        if ((parseError as Error)?.message !== "INVALID_MODEL_JSON") {
          throw parseError;
        }
        items = parseNameItems(text);
      }
    } catch (e: any) {
      if (e?.message !== "INVALID_MODEL_JSON") {
        throw e;
      }
      parseRetry = true;
      const strictPrompt = `${prompt}\n\n再次强调：必须只返回符合给定 JSON Schema 的合法 JSON 对象，不要 markdown，不要解释，不要额外文本。`;

      const retryText = await requestModelContent(strictPrompt, 0.5);
      try {
        const retryParsed = safeJsonParse(retryText) as any;
        items = normalizeNameItems(retryParsed?.items);
      } catch (retryParseError) {
        if ((retryParseError as Error)?.message !== "INVALID_MODEL_JSON") {
          throw retryParseError;
        }
        items = parseNameItems(retryText);
      }
    }

    const latencyMs = Date.now() - requestStartedAt;

    await safeTrack(
      () =>
        finishGenerationBatch({
          generationId: resolvedGenerationId,
          isSuccess: true,
          latencyMs,
          resultCount: items.length,
        }),
      "finishGenerationBatch success"
    );

    await safeTrack(
      () =>
        upsertGenerationResults(
          items.map((item: NameItem, idx: number) => ({
            generationId: resolvedGenerationId,
            resultRank: idx + 1,
            resultName: item.name,
            meaningTitle: item.meaning_title,
            meaningDesc: item.meaning_desc,
            styleTags: item.style_tags,
          }))
        ),
      "upsertGenerationResults"
    );

    await safeTrack(
      () =>
        insertAnalyticsEvent({
          eventId: createEventId("evt"),
          userKey,
          sessionId,
          eventName: "generate_success",
          pageName: "results",
          generationId: resolvedGenerationId,
          keywordsCount: keywordList.length,
          meaningTag: meaning || "",
          styleTag: style || "",
          isSuccess: true,
          latencyMs,
          properties: {
            result_count: items.length,
            parse_retry: parseRetry,
            fallback_used: false,
          },
        }),
      "insert generate_success"
    );

    // 前端依赖 generation_id 关联收藏、反馈与埋点
    res.json({ generation_id: resolvedGenerationId, items });
  } catch (e: any) {
    console.error("AI generation failed:", e.message);
    const latencyMs = Date.now() - requestStartedAt;
    const errorCode = e?.code || "AI_GENERATION_FAILED";

    await safeTrack(
      () =>
        finishGenerationBatch({
          generationId: resolvedGenerationId,
          isSuccess: false,
          latencyMs,
          errorCode,
          resultCount: 0,
        }),
      "finishGenerationBatch failure"
    );

    await safeTrack(
      () =>
        insertAnalyticsEvent({
          eventId: createEventId("evt"),
          userKey,
          sessionId,
          eventName: "generate_success",
          pageName: "results",
          generationId: resolvedGenerationId,
          keywordsCount: keywordList.length,
          meaningTag: meaning || "",
          styleTag: style || "",
          isSuccess: false,
          latencyMs,
          errorCode,
        }),
      "insert generate_success failure"
    );

    res.status(500).json({ error: "AI generation failed" });
  }
});

app.post("/api/track", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const body = req.body as TrackEventBody;
  if (!body?.event_name) {
    res.status(400).json({ error: "event_name is required" });
    return;
  }

  try {
    await insertAnalyticsEvent({
      eventId: body.event_id || createEventId("evt"),
      userKey: body.user_key || "",
      sessionId: body.session_id || "",
      eventName: body.event_name,
      pageName: body.page_name || "",
      generationId: body.generation_id || "",
      keywordsCount: body.keywords_count || 0,
      meaningTag: body.meaning_tag || "",
      styleTag: body.style_tag || "",
      resultRank: body.result_rank,
      resultName: body.result_name || "",
      isSuccess: body.is_success !== false,
      latencyMs: body.latency_ms,
      errorCode: body.error_code || "",
      properties: body.properties,
    });

    // 复制/收藏事件会同步回填到生成结果计数表
    if (
      body.generation_id &&
      typeof body.result_rank === "number" &&
      body.result_rank > 0 &&
      (body.event_name === "click_copy" || body.event_name === "click_favorite")
    ) {
      await bumpGenerationResultCounter(
        body.generation_id,
        body.result_rank,
        body.event_name === "click_copy" ? "copied_count" : "favorited_count"
      );
    }

    res.json({ ok: true });
  } catch (e: any) {
    console.error("Track event failed:", e.message);
    res.status(500).json({ error: "Track event failed" });
  }
});

app.post("/api/feedback", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const body = req.body as FeedbackBody;
  if (!body?.userKey || !body?.sessionId || !body?.feedbackType) {
    res.status(400).json({ error: "userKey, sessionId and feedbackType are required" });
    return;
  }

  // 满意度反馈必须包含满意状态
  if (body.feedbackType === "satisfaction" && !body.satisfactionValue) {
    res.status(400).json({ error: "satisfactionValue is required for satisfaction feedback" });
    return;
  }

  // 通用建议反馈必须包含内容
  if (body.feedbackType === "general" && !String(body.content || "").trim()) {
    res.status(400).json({ error: "content is required for general feedback" });
    return;
  }

  try {
    await insertUserFeedback({
      userKey: body.userKey,
      sessionId: body.sessionId,
      feedbackType: body.feedbackType,
      satisfactionValue: body.satisfactionValue,
      reasonTag: body.reasonTag || "",
      content: String(body.content || "").trim(),
      pageName: body.pageName || "",
      generationId: body.generationId || "",
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error("Save feedback failed:", e.message);
    res.status(500).json({ error: "Save feedback failed" });
  }
});

app.get("/api/favorites", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const userKey = String(req.query.userKey || "").trim();
  if (!userKey) {
    res.status(400).json({ error: "userKey is required" });
    return;
  }

  try {
    const favorites = await listFavorites(userKey);
    res.json(favorites);
  } catch (e: any) {
    console.error("List favorites failed:", e.message);
    res.status(500).json({ error: "List favorites failed" });
  }
});

app.post("/api/favorites", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const { userKey, item } = req.body as FavoriteBody;
  if (!userKey || !item?.name) {
    res.status(400).json({ error: "userKey and item.name are required" });
    return;
  }

  try {
    await upsertFavorite({
      userKey,
      name: item.name,
      meaningTitle: item.meaning_title || "",
      meaningDesc: item.meaning_desc || "",
      styleTags: Array.isArray(item.style_tags) ? item.style_tags : [],
    });
    res.json({ ok: true });
  } catch (e: any) {
    console.error("Save favorite failed:", e.message);
    res.status(500).json({ error: "Save favorite failed" });
  }
});

app.delete("/api/favorites", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const { userKey, name } = req.body as FavoriteDeleteBody;
  if (!userKey || !name) {
    res.status(400).json({ error: "userKey and name are required" });
    return;
  }

  try {
    await deleteFavorite(userKey, name);
    res.json({ ok: true });
  } catch (e: any) {
    console.error("Delete favorite failed:", e.message);
    res.status(500).json({ error: "Delete favorite failed" });
  }
});

app.get("/api/admin/overview", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const dateRange = resolveDateRange(query);
    const overview = await getAdminOverview({
      startDate: dateRange.startDate,
      endDateExclusive: dateRange.endDateExclusive,
    });
    res.json({
      data: {
        kpi: {
          ...overview.kpi,
          generate_success_rate: toPercent(overview.kpi.generate_success_rate),
          copy_rate: toPercent(overview.kpi.copy_rate),
          favorite_rate: toPercent(overview.kpi.favorite_rate),
        },
        trend: overview.trend.map((item: AdminOverviewTrend) => ({
          ...item,
          generate_success_rate: toPercent(item.generate_success_rate),
          copy_rate: toPercent(item.copy_rate),
          favorite_rate: toPercent(item.favorite_rate),
        })),
      },
      summary: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin overview failed:", e?.message || e);
    res.status(500).json({ error: "Admin overview failed" });
  }
});

app.get("/api/admin/generations", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const dateRange = resolveDateRange(query);
    const filters: AdminGenerationFilters = {
      dateRange: {
        startDate: dateRange.startDate,
        endDateExclusive: dateRange.endDateExclusive,
      },
      pagination: resolvePagination(query),
      isSuccess: parseBooleanQuery(query, "isSuccess"),
      meaningTag: stringQuery(query, "meaningTag"),
      styleTag: stringQuery(query, "styleTag"),
    };
    const result = await listAdminGenerations(filters);
    res.json({
      data: result.rows,
      pagination: result.pagination,
      summary: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin generations failed:", e?.message || e);
    res.status(500).json({ error: "Admin generations failed" });
  }
});

app.get("/api/admin/events", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const dateRange = resolveDateRange(query);
    const result = await listAdminEvents({
      dateRange: {
        startDate: dateRange.startDate,
        endDateExclusive: dateRange.endDateExclusive,
      },
      pagination: resolvePagination(query),
      eventName: stringQuery(query, "eventName"),
      generationId: stringQuery(query, "generationId"),
    });
    res.json({
      data: result.rows,
      pagination: result.pagination,
      summary: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin events failed:", e?.message || e);
    res.status(500).json({ error: "Admin events failed" });
  }
});

app.get("/api/admin/favorites", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const dateRange = resolveDateRange(query);
    const filters: AdminFavoriteFilters = {
      dateRange: {
        startDate: dateRange.startDate,
        endDateExclusive: dateRange.endDateExclusive,
      },
      pagination: resolvePagination(query),
      userKey: stringQuery(query, "userKey"),
      name: stringQuery(query, "name"),
    };
    const result = await listAdminFavorites(filters);
    res.json({
      data: result.rows,
      pagination: result.pagination,
      summary: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin favorites failed:", e?.message || e);
    res.status(500).json({ error: "Admin favorites failed" });
  }
});

app.get("/api/admin/feedback", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const dateRange = resolveDateRange(query);
    const filters: AdminFeedbackFilters = {
      dateRange: {
        startDate: dateRange.startDate,
        endDateExclusive: dateRange.endDateExclusive,
      },
      pagination: resolvePagination(query),
      feedbackType: stringQuery(query, "feedbackType"),
      satisfactionValue: stringQuery(query, "satisfactionValue"),
    };
    const result = await listAdminFeedback(filters);
    res.json({
      data: result.rows,
      pagination: result.pagination,
      summary: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin feedback failed:", e?.message || e);
    res.status(500).json({ error: "Admin feedback failed" });
  }
});

app.get("/api/admin/export", async (req, res) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  try {
    const query = req.query as Record<string, unknown>;
    const moduleName = stringQuery(query, "module");
    const dateRange = resolveDateRange(query);
    const now = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");

    if (moduleName === "overview") {
      const overview = await getAdminOverview({
        startDate: dateRange.startDate,
        endDateExclusive: dateRange.endDateExclusive,
      });
      const rows: Array<Record<string, unknown>> = [
        {
          date: "SUMMARY",
          home_exposure: overview.kpi.home_exposure,
          click_generate: overview.kpi.click_generate,
          generate_success: overview.kpi.generate_success,
          generate_success_rate: toPercent(overview.kpi.generate_success_rate),
          copy_rate: toPercent(overview.kpi.copy_rate),
          favorite_rate: toPercent(overview.kpi.favorite_rate),
          avg_latency_ms: overview.kpi.avg_latency_ms,
        },
        ...overview.trend.map((item) => ({
          ...item,
          generate_success_rate: toPercent(item.generate_success_rate),
          copy_rate: toPercent(item.copy_rate),
          favorite_rate: toPercent(item.favorite_rate),
        })),
      ];
      const csv = toCsv(
        [
          "date",
          "home_exposure",
          "click_generate",
          "generate_success",
          "generate_success_rate",
          "copy_rate",
          "favorite_rate",
          "avg_latency_ms",
        ],
        rows
      );
      sendCsv(res, `admin-overview-${now}.csv`, csv);
      return;
    }

    if (moduleName === "generations") {
      const result = await listAdminGenerations({
        dateRange: {
          startDate: dateRange.startDate,
          endDateExclusive: dateRange.endDateExclusive,
        },
        pagination: { page: 1, pageSize: 100 },
        isSuccess: parseBooleanQuery(query, "isSuccess"),
        meaningTag: stringQuery(query, "meaningTag"),
        styleTag: stringQuery(query, "styleTag"),
      });
      const rows = result.rows.map((item) => ({
        ...item,
        is_success: item.is_success ? 1 : 0,
      }));
      const csv = toCsv(
        [
          "generation_id",
          "user_key",
          "session_id",
          "keywords_text",
          "keywords_count",
          "meaning_tag",
          "style_tag",
          "requested_at",
          "responded_at",
          "is_success",
          "latency_ms",
          "model_name",
          "error_code",
          "result_count",
        ],
        rows
      );
      sendCsv(res, `admin-generations-${now}.csv`, csv);
      return;
    }

    if (moduleName === "events") {
      const result = await listAdminEvents({
        dateRange: {
          startDate: dateRange.startDate,
          endDateExclusive: dateRange.endDateExclusive,
        },
        pagination: { page: 1, pageSize: 100 },
        eventName: stringQuery(query, "eventName"),
        generationId: stringQuery(query, "generationId"),
      });
      const rows = result.rows.map((item) => ({
        ...item,
        is_success: item.is_success ? 1 : 0,
        properties: item.properties ? JSON.stringify(item.properties) : "",
      }));
      const csv = toCsv(
        [
          "event_id",
          "user_key",
          "session_id",
          "event_name",
          "event_time",
          "page_name",
          "generation_id",
          "keywords_count",
          "meaning_tag",
          "style_tag",
          "result_rank",
          "result_name",
          "is_success",
          "latency_ms",
          "error_code",
          "properties",
        ],
        rows
      );
      sendCsv(res, `admin-events-${now}.csv`, csv);
      return;
    }

    if (moduleName === "favorites") {
      const result = await listAdminFavorites({
        dateRange: {
          startDate: dateRange.startDate,
          endDateExclusive: dateRange.endDateExclusive,
        },
        pagination: { page: 1, pageSize: 100 },
        userKey: stringQuery(query, "userKey"),
        name: stringQuery(query, "name"),
      });
      const rows = result.rows.map((item) => ({
        ...item,
        style_tags: (item.style_tags || []).join("|"),
      }));
      const csv = toCsv(
        [
          "user_key",
          "name",
          "meaning_title",
          "meaning_desc",
          "style_tags",
          "created_at",
          "updated_at",
        ],
        rows
      );
      sendCsv(res, `admin-favorites-${now}.csv`, csv);
      return;
    }

    if (moduleName === "feedback") {
      const result = await listAdminFeedback({
        dateRange: {
          startDate: dateRange.startDate,
          endDateExclusive: dateRange.endDateExclusive,
        },
        pagination: { page: 1, pageSize: 100 },
        feedbackType: stringQuery(query, "feedbackType"),
        satisfactionValue: stringQuery(query, "satisfactionValue"),
      });
      const csv = toCsv(
        [
          "user_key",
          "session_id",
          "feedback_type",
          "satisfaction_value",
          "reason_tag",
          "content",
          "page_name",
          "generation_id",
          "created_at",
        ],
        result.rows.map((item) => ({ ...item }))
      );
      sendCsv(res, `admin-feedback-${now}.csv`, csv);
      return;
    }

    res.status(400).json({ error: "Invalid module. Expected overview/generations/events/favorites/feedback" });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("startDate") || message.includes("date range")) {
      res.status(400).json({ error: message });
      return;
    }
    console.error("Admin export failed:", e?.message || e);
    res.status(500).json({ error: "Admin export failed" });
  }
});

const PORT = Number(process.env.PORT || 3001);

void (async () => {
  try {
    const ready = await initDb();
    if (ready) {
      console.log("Database initialized.");
    } else {
      console.warn("Database not configured. API will return 503 for DB endpoints.");
    }
  } catch (e: any) {
    console.error("Database init failed:", e.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
