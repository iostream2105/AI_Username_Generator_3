import { GoogleGenAI, Type } from "@google/genai";
import { GenerateParams, GeneratedName } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateNames(params: GenerateParams): Promise<Omit<GeneratedName, 'id'>[]> {
  const prompt = `
  你是一个资深的起名专家和文学创作者，擅长根据用户的关键词、期望寓意和偏好风格，创作出有内涵、有美感、不俗气的网名。
  
  用户输入：
  - 关键词（必填）：${params.keywords}
  - 期望寓意（选填）：${params.meaning || '无特定期望'}
  - 偏好风格（选填）：${params.style || '无特定风格'}
  
  要求：
  1. 生成3个网名。
  2. 名字要简短（2-4个字为主）。
  3. 避免低俗、土味、营销号感。
  4. 名字要符合用户的关键词，并结合期望寓意和风格进行升华。
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "网名" },
            meaning_title: { type: Type.STRING, description: "寓意标题（如：自由与成长感）" },
            meaning_desc: { type: Type.STRING, description: "一句话寓意解释（解释名字由哪些意象和情绪构成，以及适合什么表达）" },
            style_tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "风格标签（如：清冷, 简约）"
            }
          },
          required: ["name", "meaning_title", "meaning_desc", "style_tags"]
        }
      }
    }
  });
  
  try {
    const text = response.text || "[]";
    const result = JSON.parse(text);
    return result;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
}
