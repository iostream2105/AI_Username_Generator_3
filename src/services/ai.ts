import { GenerateParams, GeneratedName } from "../types";

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

export async function fetchFavorites(userKey: string): Promise<FavoritePayload[]> {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/favorites?userKey=${encodeURIComponent(userKey)}`);

  if (!response.ok) {
    throw new Error(`Favorites fetch error: ${response.status}`);
  }

  return response.json();
}

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
