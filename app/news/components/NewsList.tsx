"use client";

import clsx from "clsx";
import NewsSkeleton from "./NewsSkeleton";
import NewsCard from "./NewsCard";
import type { NewsArticle } from "../domain/types";
import { NEWS_PAGE_SIZE } from "../constants";

type NewsListProps = {
  articles: NewsArticle[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void | Promise<void>;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

const NewsList = ({
  articles,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  page = 1,
  pageSize = NEWS_PAGE_SIZE,
  total = 0,
  onPageChange,
}: NewsListProps) => {
  if (isLoading) {
    return <NewsSkeleton />;
  }

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <section aria-live="polite" className="space-y-6">
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Failed to load news.</p>
          {error?.message && <p className="mt-2 text-xs text-red-700">{error.message}</p>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {articles.length === 0 && !isError ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          No news found. Adjust filters or try a broader search.
        </div>
      ) : (
        <div
          data-testid="news-grid"
          className={clsx(
            "grid gap-6",
            "grid-cols-1",
            "sm:grid-cols-2",
            "md:grid-cols-2",
            "lg:grid-cols-3",
            "xl:grid-cols-4"
          )}
        >
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
          <div>
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange?.(page - 1)}
              disabled={!canGoPrev}
              className={clsx(
                "rounded-lg border px-4 py-2 font-semibold transition",
                canGoPrev
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-200 text-gray-400"
              )}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange?.(page + 1)}
              disabled={!canGoNext}
              className={clsx(
                "rounded-lg border px-4 py-2 font-semibold transition",
                canGoNext
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-200 text-gray-400"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default NewsList;
