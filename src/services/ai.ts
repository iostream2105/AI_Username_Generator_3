import { GenerateParams, GeneratedName, NameMode } from "../types";

// 统一读取前端 API 基础地址：本地走 Vite 代理，生产走环境变量
function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || "";
}

export interface GenerateApiResponse {
  generation_id: string;
  items: Omit<GeneratedName, "id">[];
}

export interface FavoritePayload {
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  generation_id?: string;
  favorite_keywords?: string[];
  favorite_meaning?: string;
  favorite_name_mode?: NameMode;
}

export interface TrackEventPayload {
  event_name: string;
  user_key: string;
  session_id: string;
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

export interface FeedbackPayload {
  userKey: string;
  sessionId: string;
  feedbackType: "satisfaction" | "general";
  satisfactionValue?: "satisfied" | "unsatisfied";
  reasonTag?: string;
  content?: string;
  pageName?: string;
  generationId?: string;
}

// 生成网名主接口：返回 generation_id 供后续埋点/反馈关联
export async function generateNames(params: GenerateParams): Promise<GenerateApiResponse> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

// 获取用户收藏列表
export async function fetchFavorites(userKey: string): Promise<FavoritePayload[]> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/favorites?userKey=${encodeURIComponent(userKey)}`);

  if (!response.ok) {
    throw new Error(`Favorites fetch error: ${response.status}`);
  }

  return response.json();
}

// 新增收藏
export async function addFavorite(userKey: string, item: FavoritePayload): Promise<void> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey, item }),
  });

  if (!response.ok) {
    throw new Error(`Add favorite error: ${response.status}`);
  }
}

// 取消收藏
export async function removeFavorite(userKey: string, name: string): Promise<void> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/favorites`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey, name }),
  });

  if (!response.ok) {
    throw new Error(`Remove favorite error: ${response.status}`);
  }
}

// 通用埋点上报接口
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Track event error: ${response.status}`);
  }
}

// 用户反馈接口：支持满意度反馈与通用意见反馈
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Feedback submit error: ${response.status}`);
  }
}
