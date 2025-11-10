"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type Row = {
  data_id: string;
  gender: string;
  age: number;
  city: string;
  status: string;
  disease_id: string;
  disease_name?: string;
  location_id: string;
  location_name?: string;
  location_province?: string;
  severity: string;
  news_portal?: string;
  news_title?: string;
  news_type?: string;
  news_content?: string;
  news_url?: string;
  news_author?: string;
  news_date_published?: string;
  payload?: any;
};

function ViewContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const dataId = sp.get("id") || "";
  const fileName = sp.get("fileName") || "Dataset Detail";
  const lastEdited = sp.get("lastEdited") || "";
  const submittedBy = sp.get("submittedBy") || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataId) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/expert-feature/api/expert/datasets/${dataId}/rows/?page=1&pageSize=200`,
          { headers: { "X-API-KEY": API_KEY } }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        setRows(json.results ?? json.data ?? []);
      } catch (e) {
        console.error(e);
        setError("Gagal memuat data baris.");
      }
    })();
  }, [API_URL, API_KEY, dataId]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="flex-grow w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-screen-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-[#4A78E0] text-sm font-medium mb-2 hover:underline"
          >
            &lt; back
          </button>

          <h1 className="text-2xl font-semibold text-gray-800 mb-1">{fileName}</h1>

          <div className="text-gray-500 text-sm mb-4 space-x-2">
            {lastEdited && (
              <span>
                Last edited: <span className="font-medium text-gray-600">{lastEdited}</span>
              </span>
            )}
            {submittedBy && (
              <span>
                • Submitted by: <span className="font-medium text-gray-600">{submittedBy}</span>
              </span>
            )}
          </div>

          {error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : rows.length ? (
            <div className="w-full bg-[#F3F7FB] overflow-x-auto mb-20">
              <div className="inline-block min-w-full">
                <div className="rounded-2xl border shadow-sm bg-white overflow-hidden">
                  <table className="min-w-[1400px] w-full text-sm sm:text-base">
                    <thead className="bg-[#4A78E0] text-white">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-left">ID Data</th>
                        <th className="px-4 py-3 font-semibold text-left">Jenis Kelamin</th>
                        <th className="px-4 py-3 font-semibold text-left">Usia</th>
                        <th className="px-4 py-3 font-semibold text-left">Kota</th>
                        <th className="px-4 py-3 font-semibold text-left">Provinsi</th>
                        <th className="px-4 py-3 font-semibold text-left">Status</th>
                        <th className="px-4 py-3 font-semibold text-left">Penyakit</th>
                        <th className="px-4 py-3 font-semibold text-left">Sumber Berita</th>
                        <th className="px-4 py-3 font-semibold text-left min-w-[250px]">
                          Judul Berita
                        </th>
                        <th className="px-4 py-3 font-semibold text-left">Jenis Berita</th>
                        <th className="px-4 py-3 font-semibold text-left min-w-[400px]">
                          Ringkasan
                        </th>
                        <th className="px-4 py-3 font-semibold text-left">URL</th>
                        <th className="px-4 py-3 font-semibold text-left min-w-[200px]">Penulis</th>
                        <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                          Tanggal Terbit
                        </th>
                        <th className="px-4 py-3 font-semibold text-left">Tingkat Keparahan</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((r, i) => {
                        const disease =
                          r.disease_name ??
                          (typeof r.payload?.disease === "string"
                            ? r.payload?.disease
                            : r.payload?.disease?.name) ??
                          r.disease_id;

                        const province =
                          r.location_province ??
                          r.payload?.location?.province ??
                          "";

                        const news_portal =
                          r.news_portal ??
                          r.payload?.news?.portal ??
                          r.payload?.news_portal ??
                          "-";

                        const news_title =
                          r.news_title ??
                          r.payload?.news?.title ??
                          r.payload?.news_title ??
                          "-";

                        const news_type =
                          r.news_type ??
                          r.payload?.news?.type ??
                          r.payload?.news_type ??
                          "-";

                        const news_content =
                          r.news_content ??
                          r.payload?.news?.content ??
                          r.payload?.news_content ??
                          "-";

                        const news_url =
                          r.news_url ??
                          r.payload?.news?.url ??
                          r.payload?.news_url ??
                          "-";

                        const news_author =
                          r.news_author ??
                          r.payload?.news?.author ??
                          r.payload?.news_author ??
                          "-";

                        const news_date =
                          r.news_date_published ??
                          r.payload?.news?.date_published ??
                          r.payload?.news_date_published ??
                          "-";

                        return (
                          <tr key={i} className="border-t border-gray-200 align-top">
                            <td className="px-4 py-3">{r.data_id}</td>
                            <td className="px-4 py-3">{r.gender}</td>
                            <td className="px-4 py-3">{r.age}</td>
                            <td className="px-4 py-3">{r.city}</td>
                            <td className="px-4 py-3">{province}</td>
                            <td className="px-4 py-3">{r.status}</td>
                            <td className="px-4 py-3">{disease}</td>
                            <td className="px-4 py-3">{news_portal}</td>
                            <td className="px-4 py-3 min-w-[250px] max-w-[300px] whitespace-normal break-words">
                              {news_title}
                            </td>
                            <td className="px-4 py-3">{news_type}</td>
                            <td className="px-4 py-3 min-w-[400px] max-w-[450px] whitespace-normal break-words">
                              {news_content}
                            </td>
                            <td className="px-4 py-3">
                              {news_url !== "-" ? (
                                <a
                                  href={news_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2E66D4] underline break-words"
                                >
                                  {news_url}
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 min-w-[200px] max-w-[250px] whitespace-normal break-words">{news_author}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{news_date}</td>
                            <td className="px-4 py-3">{r.severity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">No data available</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ExpertViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading data…</div>}>
      <ViewContent />
    </Suspense>
  );
}
