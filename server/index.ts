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

function createEventId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function splitKeywords(raw: string) {
  return raw
    .split(/[,\s，、]+/)
    .map((x) => x.trim())
    .filter(Boolean);
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

  if (!isDbReady()) {
    res.status(503).json({ error: "Database is not configured" });
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
    await upsertGenerationBatchStart({
      generationId: resolvedGenerationId,
      userKey,
      sessionId,
      keywordsText: keywords,
      keywordsJson: keywordList,
      keywordsCount: keywordList.length,
      meaningTag: meaning || "",
      styleTag: style || "",
      modelName: MODEL_NAME,
    });

    await insertAnalyticsEvent({
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
    });

    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      thinking: { type: "disabled" },
    } as any);

    const text = completion.choices[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    const items = Array.isArray(parsed) ? parsed : [];
    const latencyMs = Date.now() - requestStartedAt;

    await finishGenerationBatch({
      generationId: resolvedGenerationId,
      isSuccess: true,
      latencyMs,
      resultCount: items.length,
    });

    await upsertGenerationResults(
      items.map((item: any, idx: number) => ({
        generationId: resolvedGenerationId,
        resultRank: idx + 1,
        resultName: String(item?.name || ""),
        meaningTitle: String(item?.meaning_title || ""),
        meaningDesc: String(item?.meaning_desc || ""),
        styleTags: Array.isArray(item?.style_tags) ? item.style_tags.map(String) : [],
      }))
    );

    await insertAnalyticsEvent({
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
      properties: { result_count: items.length },
    });

    res.json({ generation_id: resolvedGenerationId, items });
  } catch (e: any) {
    console.error("AI generation failed:", e.message);
    const latencyMs = Date.now() - requestStartedAt;
    const errorCode = e?.code || "AI_GENERATION_FAILED";

    try {
      await finishGenerationBatch({
        generationId: resolvedGenerationId,
        isSuccess: false,
        latencyMs,
        errorCode,
        resultCount: 0,
      });

      await insertAnalyticsEvent({
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
      });
    } catch (trackErr: any) {
      console.error("Track generation failure failed:", trackErr.message);
    }

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
