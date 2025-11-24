"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DefaultThumbnail from "../components/DefaultThumbnail";
import NewsDetailSkeleton from "../components/NewsDetailSkeleton";
import { useNewsDetail } from "../hooks/useNewsDetail";

type NewsDetailPageProps = {
  params: {
    id: string;
  };
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const NewsDetailPage = ({ params }: NewsDetailPageProps) => {
  const articleId = params?.id;
  const { data, isLoading, isError, error } = useNewsDetail(articleId);

  let content: ReactNode;

  if (isLoading) {
    content = (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <NewsDetailSkeleton />
      </main>
    );
  } else if (isError || !data) {
    content = (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <section
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">News Salads</p>
          <h1 className="mt-4 text-3xl font-bold">Article not found</h1>
          <p className="mt-2 text-sm text-amber-800">
            We couldn&apos;t find the article you are looking for. It might have been removed or is temporarily
            unavailable.
          </p>
          {error?.message && <p className="mt-3 text-xs text-amber-700">{error.message}</p>}
          <Link
            href="/news"
            className="mt-6 inline-flex rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Back to news
          </Link>
        </section>
      </main>
    );
  } else {
    content = (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <DefaultThumbnail src={data.thumbnail_url ?? undefined} alt={data.title} priority />
          <div className="space-y-6 p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
              <div className="font-semibold text-blue-600">{data.source_name}</div>
              <time dateTime={data.published_at}>{formatDate(data.published_at)}</time>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{data.title}</h1>
            {Array.isArray(data.curated_tags) && data.curated_tags.length > 0 && (
              <div className="flex flex-wrap gap-3" aria-label="Curated tags">
                {data.curated_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-lg leading-relaxed text-gray-700">{data.summary}</p>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6 text-sm text-gray-600">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ← Back to News Salads
              </Link>
              <Link
                href={data.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Read at source
              </Link>
            </div>
          </div>
        </article>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      {content}
      <Footer />
    </>
  );
};

export default NewsDetailPage;
