import type { NewsArticle, NewsListResponse } from "../domain/types";
import type { NormalizedNewsQuery } from "./NewsQuery";

export class NewsMapper {
  static extractArticles(payload: unknown): NewsArticle[] {
    if (Array.isArray((payload as { data?: NewsArticle[] })?.data)) {
      return (payload as { data: NewsArticle[] }).data;
    }
    if (Array.isArray((payload as { results?: NewsArticle[] })?.results)) {
      return (payload as { results: NewsArticle[] }).results;
    }
    if (Array.isArray((payload as { articles?: NewsArticle[] })?.articles)) {
      return (payload as { articles: NewsArticle[] }).articles;
    }
    return [];
  }

  static extractTotal(payload: unknown, fallback: number): number {
    if (typeof (payload as { total?: number })?.total === "number") {
      return (payload as { total: number }).total;
    }
    if (typeof (payload as { count?: number })?.count === "number") {
      return (payload as { count: number }).count;
    }
    if (typeof (payload as { totalResults?: number })?.totalResults === "number") {
      return (payload as { totalResults: number }).totalResults;
    }
    return fallback;
  }

  static extractPage(payload: unknown, fallback: number): number {
    if (typeof (payload as { page?: number })?.page === "number") {
      return (payload as { page: number }).page;
    }
    if (typeof (payload as { currentPage?: number })?.currentPage === "number") {
      return (payload as { currentPage: number }).currentPage;
    }
    return fallback;
  }

  static extractPageSize(payload: unknown, fallback: number): number {
    if (typeof (payload as { pageSize?: number })?.pageSize === "number") {
      return (payload as { pageSize: number }).pageSize;
    }
    if (typeof (payload as { per_page?: number })?.per_page === "number") {
      return (payload as { per_page: number }).per_page;
    }
    return fallback;
  }

  static toListResponse(payload: unknown, normalizedQuery: NormalizedNewsQuery): NewsListResponse {
    const articles = this.extractArticles(payload);
    const total = this.extractTotal(payload, articles.length);
    const page = this.extractPage(payload, normalizedQuery.page);
    const pageSize = this.extractPageSize(payload, normalizedQuery.pageSize);

    return {
      data: articles,
      page,
      pageSize,
      total,
    };
  }

  static toArticle(payload: unknown): NewsArticle | undefined {
    if (!payload || typeof payload !== "object") return undefined;
    return payload as NewsArticle;
  }

  static async readErrorDetail(res: Response): Promise<string> {
    try {
      const payload = await res.json();
      if (typeof payload?.detail === "string") return payload.detail;
      if (typeof payload?.message === "string") return payload.message;
      return "";
    } catch {
      return "";
    }
  }
}
