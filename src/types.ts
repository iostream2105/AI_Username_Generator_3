export type NameMode = "cn" | "en" | "mix";

export interface GeneratedName {
  id: string;
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  result_rank?: number;
  generation_id?: string;
  favorite_keywords?: string[];
  favorite_meaning?: string;
  favorite_name_mode?: NameMode;
}

export interface GenerateParams {
  keywords: string;
  nameMode?: NameMode;
  meaning?: string;
  userKey?: string;
  sessionId?: string;
  generationId?: string;
}
