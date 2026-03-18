const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

function buildPrompt(keywords, meaning, style) {
  return `你是一个资深的起名专家和文学创作者，擅长根据用户的关键词、期望寓意和偏好风格，创作出有内涵、有美感、不俗气的网名。

用户输入：
- 关键词（必填）：${keywords}
- 期望寓意（选填）：${meaning || "无特定期望"}
- 偏好风格（选填）：${style || "无特定风格"}

要求：
1. 生成 3 个网名
2. 名字简短（2-4个字）
3. 避免低俗、土味、营销号感
4. 符合关键词并结合寓意和风格

请严格返回 JSON 数组，不要输出其他文字：
[
  {
    "name": "网名",
    "meaning_title": "寓意标题",
    "meaning_desc": "一句话解释",
    "style_tags": ["标签1", "标签2"]
  }
]`;
}

async function handleGenerate(req, res) {
  const { keywords, meaning, style } = req.body || {};

  if (!keywords) {
    return res.status(400).json({ error: "keywords is required" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "doubao-seed-2-0-pro-260215",
      messages: [{ role: "user", content: buildPrompt(keywords, meaning, style) }],
      temperature: 0.8,
      thinking: { type: "disabled" },
    });

    const text = completion.choices?.[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    return res.json(result);
  } catch (e) {
    console.error("AI generation failed:", e.message);
    return res.status(500).json({ error: "AI generation failed" });
  }
}

app.post("/", handleGenerate);
app.post("/api/generate", handleGenerate);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(9000, () => {
  console.log("HTTP function server started at 9000");
});