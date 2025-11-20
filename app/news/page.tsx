"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NewsList from "./components/NewsList";
import { useNewsList } from "./hooks/useNewsList";
import { NEWS_PAGE_SIZE } from "./constants";

const NewsPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useNewsList({
    page,
    pageSize: NEWS_PAGE_SIZE,
  });
  const articles = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Berita</p>
          <h1 className="text-4xl font-bold text-gray-900">News Salads</h1>
          <p className="text-base text-gray-600">
            Kurasi informasi terbaru mengenai persebaran penyakit dan data kesiapsiagaan nasional.
          </p>
        </header>

        <section className="mt-10">
          <NewsList
            articles={articles}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            page={page}
            pageSize={NEWS_PAGE_SIZE}
            total={total}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default NewsPage;
