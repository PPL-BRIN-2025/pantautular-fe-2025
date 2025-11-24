"use client";

import Link from "next/link";
import DefaultThumbnail from "./DefaultThumbnail";
import type { NewsArticle } from "../hooks/useNewsList";

type NewsCardProps = {
  article: NewsArticle;
  href?: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const NewsCard = ({ article, href }: NewsCardProps) => {
  const targetHref = href ?? `/news/${article.id}`;
  const publishedDate = formatDate(article.published_at);

  return (
    <Link
      href={targetHref}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={article.title}
      data-testid="news-card"
    >
      <article className="flex h-full flex-col">
        <DefaultThumbnail src={article.thumbnail_url ?? undefined} alt={article.title} />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium text-blue-600">{article.source_name}</span>
            <time dateTime={article.published_at}>{publishedDate}</time>
          </div>
          <h3
            className="text-lg font-semibold text-gray-900"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {article.title}
          </h3>
          <p
            className="text-sm text-gray-600"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {article.summary}
          </p>
          {article.is_curated && Array.isArray(article.curated_tags) && article.curated_tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2" aria-label="Curated tags">
              {article.curated_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;
