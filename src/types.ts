export interface GeneratedName {
  id: string;
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
  result_rank?: number;
  generation_id?: string;
}

export interface GenerateParams {
  keywords: string;
  meaning?: string;
  style?: string;
  userKey?: string;
  sessionId?: string;
  generationId?: string;
}
