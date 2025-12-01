import type { NewsArticle, NewsListResponse } from "../domain/types";
import { NewsMapper } from "./NewsMapper";
import { NewsQuery, type NewsQueryParams } from "./NewsQuery";

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type RequestOptions = {
  signal?: AbortSignal;
};

const buildQuery = (params: NewsQuery | NewsQueryParams): NewsQuery =>
  params instanceof NewsQuery ? params : NewsQuery.create(params);

export class NewsGateway {
  private readonly fetcher: Fetcher;

  constructor(fetcher: Fetcher = fetch) {
    this.fetcher = fetcher;
  }

  async list(params: NewsQuery | NewsQueryParams, options: RequestOptions = {}): Promise<NewsListResponse> {
    const query = buildQuery(params);
    const url = `/api/news?${query.toQueryString()}`;

    const res = await this.fetcher(url, {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    });

    if (!res.ok) {
      const detail = await NewsMapper.readErrorDetail(res);
      throw new Error(`Failed to load news (${res.status})${detail ? `: ${detail}` : ""}`);
    }

    const payload = await res.json();
    return NewsMapper.toListResponse(payload, query.value());
  }

  async detail(id: string | number, options: RequestOptions = {}): Promise<NewsArticle | undefined> {
    const normalizedId = typeof id === "number" ? String(id) : id.trim();
    const res = await this.fetcher(`/api/news/${normalizedId}`, {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    });

    if (!res.ok) {
      const detail = await NewsMapper.readErrorDetail(res);
      throw new Error(`Failed to fetch news detail (${res.status})${detail ? `: ${detail}` : ""}`);
    }

    const payload = await res.json();
    return NewsMapper.toArticle(payload);
  }
}
