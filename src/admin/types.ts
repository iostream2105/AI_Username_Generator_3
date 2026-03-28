export interface AdminPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminApiListResponse<T> {
  data: T[];
  pagination: AdminPagination;
  summary?: {
    startDate: string;
    endDate: string;
  };
}

export interface AdminOverviewKpi {
  home_exposure: number;
  click_generate: number;
  generate_success: number;
  click_share: number;
  save_poster: number;
  generate_success_rate: number;
  copy_rate: number;
  favorite_rate: number;
  share_click_rate: number;
  poster_save_rate: number;
  avg_latency_ms: number;
}

export interface AdminOverviewTrend {
  date: string;
  home_exposure: number;
  click_generate: number;
  generate_success: number;
  click_share: number;
  save_poster: number;
  generate_success_rate: number;
  copy_rate: number;
  favorite_rate: number;
  share_click_rate: number;
  poster_save_rate: number;
  avg_latency_ms: number;
}

export interface AdminOverviewResponse {
  data: {
    kpi: AdminOverviewKpi;
    trend: AdminOverviewTrend[];
  };
  summary?: {
    startDate: string;
    endDate: string;
  };
}

export interface AdminGenerationRow {
  generation_id: string;
  user_key: string;
  session_id: string;
  keywords_text: string;
  keywords_count: number;
  meaning_tag: string;
  style_tag: string;
  requested_at: string;
  responded_at: string;
  is_success: boolean;
  latency_ms: number;
  model_name: string;
  error_code: string;
  result_count: number;
}

export interface AdminEventRow {
  event_id: string;
  user_key: string;
  session_id: string;
  event_name: string;
  event_time: string;
  page_name: string;
  generation_id: string;
  keywords_count: number;
  meaning_tag: string;
  style_tag: string;
  result_rank: number;
  result_name: string;
  is_success: boolean;
  latency_ms: number;
  error_code: string;
  properties: Record<string, unknown> | null;
}

export interface AdminFavoriteRow {
  user_key: string;
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminFeedbackRow {
  user_key: string;
  session_id: string;
  feedback_type: string;
  satisfaction_value: string;
  reason_tag: string;
  content: string;
  page_name: string;
  generation_id: string;
  created_at: string;
}
