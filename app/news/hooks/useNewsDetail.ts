"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "../domain/types";
import { NewsGateway } from "../services/NewsGateway";
import { NewsMapper } from "../services/NewsMapper";

export type UseNewsDetailResult = {
  data?: NewsArticle;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

const normalizeNewsId = (id?: string | number) => {
  if (typeof id === "number") return String(id);
  if (typeof id === "string") return id.trim();
  return "";
};

export const useNewsDetail = (id?: string | number): UseNewsDetailResult => {
  const gateway = useMemo(() => new NewsGateway((...args) => fetch(...args)), []);
  const normalizedId = useMemo(() => normalizeNewsId(id), [id]);

  const [data, setData] = useState<NewsArticle>();
  const [isLoading, setIsLoading] = useState(Boolean(normalizedId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!normalizedId) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await gateway.detail(normalizedId, { signal: controller.signal });
        if (!isMounted) return;
        setData(payload as NewsArticle);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Failed to fetch news detail"));
        setData(undefined);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [gateway, normalizedId]);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
  };
};

export type { NewsArticle };
export const __testables = { normalizeNewsId, readErrorDetail: NewsMapper.readErrorDetail };
