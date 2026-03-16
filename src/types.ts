export interface GeneratedName {
  id: string;
  name: string;
  meaning_title: string;
  meaning_desc: string;
  style_tags: string[];
}

export interface GenerateParams {
  keywords: string;
  meaning?: string;
  style?: string;
}
