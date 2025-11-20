"use client";

import { NEWS_PAGE_SIZE } from "../constants";

const placeholders = Array.from({ length: NEWS_PAGE_SIZE });

const NewsSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading news list">
    {placeholders.map((_, index) => (
      <div
        key={`news-skeleton-${index}`}
        data-testid="news-skeleton-card"
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="h-40 w-full animate-pulse bg-gray-200" />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-200" />
          <div className="mt-auto flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default NewsSkeleton;
