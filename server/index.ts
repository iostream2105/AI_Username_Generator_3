import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import {
  bumpGenerationResultCounter,
  deleteFavorite,
  finishGenerationBatch,
  initDb,
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

const MODEL_NAME = "doubao-seed-2-0-pro-260215";

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

interface NameItem {
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
}

function createEventId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function splitKeywords(raw: string) {
  return raw
    .split(/[,\s，、]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function safeJsonParse(raw: string): unknown {
  const normalized = raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(normalized);
}

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

function buildFallbackItems(keywordList: string[], meaning?: string, style?: string): NameItem[] {
  const base = keywordList.length > 0 ? keywordList[0] : "星";
  const second = keywordList.length > 1 ? keywordList[1] : "海";
  const styleTag = style || "简约";
  const meaningText = meaning || "自由";

  return [
    {
      name: `${base}见`,
      meaning_title: `${meaningText}感`,
      meaning_desc: `用“${base}”承载你的关键词记忆，整体表达克制且有留白感。`,
      style_tags: [styleTag, "简约"],
    },
    {
      name: `${second}未眠`,
      meaning_title: `${meaningText}与生命力`,
      meaning_desc: `在“${second}”的意象上加入情绪张力，适合安静但有力量的表达。`,
      style_tags: [styleTag, "文艺"],
    },
    {
      name: `${base}${second}`,
      meaning_title: `${meaningText}与流动感`,
      meaning_desc: `融合关键词核心意象，短促好记，适合日常社交昵称使用。`,
      style_tags: [styleTag, "清冷"],
    },
  ];
}

async function safeTrack(task: () => Promise<void>, label: string) {
  if (!isDbReady()) return;
  try {
    await task();
  } catch (e: any) {
    console.error(`${label} failed:`, e?.message || e);
  }
}

async function requestModelContent(prompt: string, temperature = 0.8): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature,
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

请严格按照以下 JSON 数组格式返回，不要包含任何其他文字：
[
  {
    "name": "网名",
    "meaning_title": "寓意标题（如：自由与成长感）",
    "meaning_desc": "一句话寓意解释（解释名字由哪些意象和情绪构成，以及适合什么表达）",
    "style_tags": ["风格标签1", "风格标签2"]
  }
]`;

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

    let items: NameItem[] = [];
    let parseRetry = false;
    let fallbackUsed = false;

    try {
      const text = await requestModelContent(prompt, 0.8);
      items = parseNameItems(text);
    } catch (e: any) {
      if (e?.message !== "INVALID_MODEL_JSON") {
        throw e;
      }

      parseRetry = true;
      const strictPrompt = `${prompt}\n\n再次强调：必须只返回合法 JSON 数组，不要 markdown，不要解释，不要额外文本。`;

      try {
        const retryText = await requestModelContent(strictPrompt, 0.5);
        items = parseNameItems(retryText);
      } catch (retryErr: any) {
        if (retryErr?.message !== "INVALID_MODEL_JSON") {
          throw retryErr;
        }
        fallbackUsed = true;
        items = buildFallbackItems(keywordList, meaning, style);
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
            fallback_used: fallbackUsed,
          },
        }),
      "insert generate_success"
    );

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
