"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NEWS_PAGE_SIZE } from "../constants";

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

export type UseNewsListParams = {
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

export type UseNewsListResult = {
  data?: NewsListResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = NEWS_PAGE_SIZE;

const toQueryString = (params: Required<Pick<UseNewsListParams, "page" | "pageSize">> & Omit<UseNewsListParams, "page" | "pageSize">) => {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("page_size", String(params.pageSize));

  if (params.search) query.set("search", params.search);
  if (params.source) query.set("source", params.source);
  if (params.tags && params.tags.length > 0) query.set("tags", params.tags.join(","));
  if (params.curatedOnly) query.set("curated_only", "true");
  if (params.fromDate) query.set("from_date", params.fromDate);
  if (params.toDate) query.set("to_date", params.toDate);
  if (typeof params.hasImage === "boolean") query.set("has_image", String(params.hasImage));

  return query.toString();
};

const normalizeParams = (params: UseNewsListParams = {}) => {
  let normalizedTags: string[] | undefined;
  if (Array.isArray(params.tags)) {
    const trimmed = params.tags.map((tag) => tag.trim()).filter(Boolean);
    if (trimmed.length > 0) {
      normalizedTags = trimmed;
    }
  }

  return {
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
};

const readErrorDetail = async (res: Response) => {
  try {
    const payload = await res.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (typeof payload?.message === "string") return payload.message;
    return "";
  } catch {
    return "";
  }
};

const extractArticles = (payload: unknown): NewsArticle[] => {
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
};

const extractTotal = (payload: unknown, fallback: number) => {
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
};

const extractPage = (payload: unknown, fallback: number) => {
  if (typeof (payload as { page?: number })?.page === "number") {
    return (payload as { page: number }).page;
  }
  if (typeof (payload as { currentPage?: number })?.currentPage === "number") {
    return (payload as { currentPage: number }).currentPage;
  }
  return fallback;
};

const extractPageSize = (payload: unknown, fallback: number) => {
  if (typeof (payload as { pageSize?: number })?.pageSize === "number") {
    return (payload as { pageSize: number }).pageSize;
  }
  if (typeof (payload as { per_page?: number })?.per_page === "number") {
    return (payload as { per_page: number }).per_page;
  }
  return fallback;
};

export const useNewsList = (params: UseNewsListParams = {}): UseNewsListResult => {
  const normalized = useMemo(() => normalizeParams(params), [
    params.page,
    params.pageSize,
    params.search,
    params.source,
    Array.isArray(params.tags) ? params.tags.join("|") : params.tags,
    params.curatedOnly,
    params.fromDate,
    params.toDate,
    params.hasImage,
  ]);
  const serializedParams = useMemo(() => JSON.stringify(normalized), [normalized]);

  const [data, setData] = useState<NewsListResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `/api/news?${toQueryString(normalized)}`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = await readErrorDetail(res);
          throw new Error(`Failed to load news (${res.status})${detail ? `: ${detail}` : ""}`);
        }
        const payload = await res.json();
        if (!isMounted) return;

        const articles = extractArticles(payload);
        const total = extractTotal(payload, articles.length);
        const responsePage = extractPage(payload, normalized.page);
        const responsePageSize = extractPageSize(payload, normalized.pageSize);

        setData({
          data: articles,
          page: responsePage,
          pageSize: responsePageSize,
          total,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Failed to load news"));
        setData(undefined);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [serializedParams, normalized, reloadIndex]);

  const refetch = useCallback(async () => {
    setReloadIndex((value) => value + 1);
  }, []);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refetch,
  };
};

export const __testables = {
  toQueryString,
  normalizeParams,
  readErrorDetail,
  extractArticles,
  extractTotal,
  extractPage,
  extractPageSize,
};
