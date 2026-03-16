import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

interface GenerateBody {
  keywords: string;
  meaning?: string;
  style?: string;
}

app.post("/api/generate", async (req, res) => {
  const { keywords, meaning, style } = req.body as GenerateBody;

  if (!keywords) {
    res.status(400).json({ error: "keywords is required" });
    return;
  }

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
    const completion = await client.chat.completions.create({
      model: "doubao-seed-2-0-pro-260215",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      thinking: { type: "disabled" },
    } as any);

    const text = completion.choices[0]?.message?.content || "[]";
    // Extract JSON array from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    res.json(result);
  } catch (e: any) {
    console.error("AI generation failed:", e.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
