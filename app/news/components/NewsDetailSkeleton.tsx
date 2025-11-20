"use client";

const paragraphs = Array.from({ length: 3 });

const NewsDetailSkeleton = () => (
  <section
    data-testid="news-detail-skeleton"
    className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    aria-label="Loading article detail"
  >
    <div className="h-64 w-full animate-pulse rounded-xl bg-gray-200" />
    <div className="mt-6 space-y-4">
      <div data-testid="news-detail-skeleton-title" className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-4">
        <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/5 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
        <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="space-y-3">
        {paragraphs.map((_, index) => (
          <div
            key={`detail-skeleton-${index}`}
            data-testid="news-detail-skeleton-paragraph"
            className="h-4 w-full animate-pulse rounded bg-gray-100"
          />
        ))}
      </div>
    </div>
  </section>
);

export default NewsDetailSkeleton;
