import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import {
  bumpGenerationResultCounter,
  deleteFavorite,
  finishGenerationBatch,
  initDb,
  insertUserFeedback,
  insertAnalyticsEvent,
  isDbReady,
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
