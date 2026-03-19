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

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });
  return query.toString();
}

async function requestJson<T>(path: string) {
  const res = await fetch(`${getApiBase()}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function buildExportUrl(
  moduleName: "overview" | "generations" | "events" | "favorites" | "feedback",
  params: Record<string, string | number | boolean | undefined>
) {
  const query = buildQuery({ module: moduleName, ...params });
  return `${getApiBase()}/api/admin/export?${query}`;
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
