"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "./useNewsList";

export type { NewsArticle };

export type UseNewsDetailResult = {
  data?: NewsArticle;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
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

export const useNewsDetail = (id?: string | number): UseNewsDetailResult => {
  const normalizedId = useMemo(() => {
    if (typeof id === "number") return String(id);
    if (typeof id === "string") return id.trim();
    return "";
  }, [id]);

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
        const res = await fetch(`/api/news/${normalizedId}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = await readErrorDetail(res);
          throw new Error(`Failed to fetch news detail (${res.status})${detail ? `: ${detail}` : ""}`);
        }

        const payload = await res.json();
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
  }, [normalizedId]);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
  };
};
