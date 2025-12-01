"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NewsArticle, NewsListResponse } from "../domain/types";
import { NewsGateway } from "../services/NewsGateway";
import { NewsMapper } from "../services/NewsMapper";
import { NewsQuery, type NewsQueryParams } from "../services/NewsQuery";

export type UseNewsListResult = {
  data?: NewsListResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export const useNewsList = (params: NewsQueryParams = {}): UseNewsListResult => {
  const gateway = useMemo(() => new NewsGateway((...args) => fetch(...args)), []);
  const query = useMemo(() => NewsQuery.create(params), [
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
  const serializedQuery = useMemo(() => query.serialize(), [query]);

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
        const response = await gateway.list(query, { signal: controller.signal });
        if (!isMounted) return;
        setData(response);
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
  }, [gateway, serializedQuery, query, reloadIndex]);

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
  toQueryString: (params: NewsQueryParams) => NewsQuery.create(params).toQueryString(),
  normalizeParams: (params?: NewsQueryParams) => NewsQuery.create(params).value(),
  readErrorDetail: (res: Response) => NewsMapper.readErrorDetail(res),
  extractArticles: (payload: unknown) => NewsMapper.extractArticles(payload),
  extractTotal: (payload: unknown, fallback: number) => NewsMapper.extractTotal(payload, fallback),
  extractPage: (payload: unknown, fallback: number) => NewsMapper.extractPage(payload, fallback),
  extractPageSize: (payload: unknown, fallback: number) => NewsMapper.extractPageSize(payload, fallback),
};

export type { NewsArticle, NewsListResponse };
