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
  location_id: string;
  severity: string;
};

function ExpertViewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const dataId = searchParams.get("id");
  const fileName = searchParams.get("fileName");
  const lastEdited = searchParams.get("lastEdited");
  const submittedBy = searchParams.get("submittedBy");

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataId) return;
    const fetchRows = async () => {
      try {
        const res = await fetch(
          `${API_URL}/expert-feature/api/expert/datasets/${dataId}/rows/?page=1&pageSize=100`,
          { headers: { "X-API-KEY": API_KEY } }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        setRows(json.results || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch dataset rows.");
      }
    };
    fetchRows();
  }, [dataId, API_URL, API_KEY]);

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <button
          onClick={() => router.back()}
          className="text-[#4A78E0] text-sm font-medium mb-2 hover:underline"
        >
          &lt; back
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          {fileName || "Dataset Detail"}
        </h1>
        <div className="text-gray-500 text-sm mb-4">
          {lastEdited && (
            <>Last edited: <span className="font-medium text-gray-600">{lastEdited}</span> • </>
          )}
          {submittedBy && (
            <>Submitted by: <span className="font-medium text-gray-600">{submittedBy}</span></>
          )}
        </div>

        {error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : rows.length ? (
          <div className="rounded-2xl border shadow-sm bg-white overflow-x-auto">
            <table className="min-w-full text-sm sm:text-base">
              <thead className="bg-[#4A78E0] text-white">
                <tr>
                  {[
                    "ID Data",
                    "Jenis Kelamin",
                    "Usia",
                    "Kota",
                    "Status",
                    "ID Penyakit",
                    "ID Lokasi",
                    "Tingkat Keparahan",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-4 py-3">{r.data_id}</td>
                    <td className="px-4 py-3">{r.gender}</td>
                    <td className="px-4 py-3">{r.age}</td>
                    <td className="px-4 py-3">{r.city}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.disease_id}</td>
                    <td className="px-4 py-3">{r.location_id}</td>
                    <td className="px-4 py-3">{r.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">No data available</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ExpertViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading data…</div>}>
      <ExpertViewPageContent />
    </Suspense>
  );
}