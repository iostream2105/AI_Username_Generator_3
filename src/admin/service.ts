import {
  AdminApiListResponse,
  AdminEventRow,
  AdminFavoriteRow,
  AdminFeedbackRow,
  AdminGenerationRow,
  AdminOverviewResponse,
} from "./types";

function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || "";
}

const ADMIN_TOKEN_STORAGE_KEY = "ai_admin_token";

export interface AdminLoginResponse {
  token: string;
  expiresAt: number;
  username: string;
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });
  return query.toString();
}

async function requestJson<T>(path: string) {
  const token = getAdminToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${getApiBase()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed: ${res.status}`);
  }
  const data = (await res.json()) as AdminLoginResponse;
  setAdminToken(data.token);
  return data;
}

export async function exportAdminCsv(
  moduleName: "overview" | "generations" | "events" | "favorites" | "feedback",
  params: Record<string, string | number | boolean | undefined>
) {
  const query = buildQuery({ module: moduleName, ...params });
  const token = getAdminToken();
  const res = await fetch(`${getApiBase()}/api/admin/export?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed: ${res.status}`);
  }

  const blob = await res.blob();
  const contentDisposition = res.headers.get("content-disposition") || "";
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return {
    blob,
    fileName: fileNameMatch?.[1] || `admin-${moduleName}.csv`,
  };
}

export function getOverview(params: { startDate: string; endDate: string }) {
  const query = buildQuery(params);
  return requestJson<AdminOverviewResponse>(`/api/admin/overview?${query}`);
}

export function getGenerations(params: {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  isSuccess?: string;
  meaningTag?: string;
  styleTag?: string;
}) {
  const query = buildQuery(params);
  return requestJson<AdminApiListResponse<AdminGenerationRow>>(`/api/admin/generations?${query}`);
}

export function getEvents(params: {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  eventName?: string;
  generationId?: string;
}) {
  const query = buildQuery(params);
  return requestJson<AdminApiListResponse<AdminEventRow>>(`/api/admin/events?${query}`);
}

export function getFavorites(params: {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  userKey?: string;
  name?: string;
}) {
  const query = buildQuery(params);
  return requestJson<AdminApiListResponse<AdminFavoriteRow>>(`/api/admin/favorites?${query}`);
}

export function getFeedback(params: {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  feedbackType?: string;
  satisfactionValue?: string;
}) {
  const query = buildQuery(params);
  return requestJson<AdminApiListResponse<AdminFeedbackRow>>(`/api/admin/feedback?${query}`);
}
