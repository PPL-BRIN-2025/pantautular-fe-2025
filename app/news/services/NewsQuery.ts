import { NEWS_PAGE_SIZE } from "../constants";

export type NewsQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  source?: string;
  tags?: string[];
  curatedOnly?: boolean;
  fromDate?: string;
  toDate?: string;
  hasImage?: boolean;
};

export type NormalizedNewsQuery = {
  page: number;
  pageSize: number;
  search?: string;
  source?: string;
  tags?: string[];
  curatedOnly: boolean;
  fromDate?: string;
  toDate?: string;
  hasImage?: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = NEWS_PAGE_SIZE;

export class NewsQuery {
  private readonly normalized: NormalizedNewsQuery;

  private constructor(normalized: NormalizedNewsQuery) {
    this.normalized = normalized;
  }

  static create(params: NewsQueryParams = {}): NewsQuery {
    let normalizedTags: string[] | undefined;
    if (Array.isArray(params.tags)) {
      const trimmed = params.tags.map((tag) => tag.trim()).filter(Boolean);
      if (trimmed.length > 0) {
        normalizedTags = trimmed;
      }
    }

    const normalized: NormalizedNewsQuery = {
      page: params.page && params.page > 0 ? params.page : DEFAULT_PAGE,
      pageSize: params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE,
      search: params.search?.trim() || undefined,
      source: params.source?.trim() || undefined,
      tags: normalizedTags,
      curatedOnly: Boolean(params.curatedOnly),
      fromDate: params.fromDate ?? undefined,
      toDate: params.toDate ?? undefined,
      hasImage: typeof params.hasImage === "boolean" ? params.hasImage : undefined,
    };

    return new NewsQuery(normalized);
  }

  toQueryString(): string {
    const query = new URLSearchParams();
    query.set("page", String(this.normalized.page));
    query.set("page_size", String(this.normalized.pageSize));

    if (this.normalized.search) query.set("search", this.normalized.search);
    if (this.normalized.source) query.set("source", this.normalized.source);
    if (this.normalized.tags && this.normalized.tags.length > 0) query.set("tags", this.normalized.tags.join(","));
    if (this.normalized.curatedOnly) query.set("curated_only", "true");
    if (this.normalized.fromDate) query.set("from_date", this.normalized.fromDate);
    if (this.normalized.toDate) query.set("to_date", this.normalized.toDate);
    if (typeof this.normalized.hasImage === "boolean") query.set("has_image", String(this.normalized.hasImage));

    return query.toString();
  }

  serialize(): string {
    return JSON.stringify(this.normalized);
  }

  value(): NormalizedNewsQuery {
    return this.normalized;
  }
}
