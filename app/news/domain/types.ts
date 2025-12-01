export type NewsArticle = {
  id: string | number;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  thumbnail_url?: string | null;
  published_at: string;
  is_curated: boolean;
  curated_tags?: string[];
};

export type NewsListResponse = {
  data: NewsArticle[];
  page: number;
  pageSize: number;
  total: number;
};
