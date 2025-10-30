"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function ExpertViewPage({
  dataset,
  fileName,
}: {
  dataset?: Row[];
  fileName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // get id from query param (e.g. ?id=ID1)
  const fileId = searchParams.get("id") || "CSV_1.xlsx";

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (dataset) {
        setRows(dataset);
        return;
      }

      // Dummy fallback
      const dummy: Row[] = [
        { data_id: "ID1", gender: "perempuan", age: 14, city: "jakarta", status: "status a", disease_id: "ID A", location_id: "ID B", severity: "severity a" },
        { data_id: "ID2", gender: "laki-laki", age: 14, city: "jakarta", status: "status b", disease_id: "ID A", location_id: "ID B", severity: "severity b" },
        { data_id: "ID3", gender: "lainnya", age: 14, city: "jakarta", status: "status c", disease_id: "ID A", location_id: "ID B", severity: "severity c" },
      ];
      setRows(dummy);
    } catch {
      setError("Failed to load data");
    }
  }, [dataset]);

  if (error) {
    return <div className="text-center text-red-500 mt-6">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-[#4A78E0] text-sm font-medium mb-2 hover:underline"
        >
          &lt; back
        </button>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          {fileName || fileId}
        </h1>
        <p className="text-gray-500 text-sm mb-4">
          {rows.length
            ? `${rows.length} rows • 8 columns`
            : "No data available"}
        </p>

        {/* Table */}
        {rows.length ? (
          <div className="rounded-2xl border shadow-sm bg-white overflow-x-auto">
            <table className="min-w-full text-sm sm:text-base">
              <thead className="bg-[#4A78E0] text-white rounded-t-2xl">
                <tr>
                  {[
                    "ID Data",
                    "Jenis Kelamin",
                    "Usia",
                    "Kota",
                    "STATUS",
                    "ID Penyakit",
                    "ID Lokasi",
                    "Tingkat Keparahan",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 font-semibold text-left border-white/30"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.data_id} className="border-t border-gray-200">
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
          <div className="text-center py-10 text-gray-500 text-sm">
            No data available
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
