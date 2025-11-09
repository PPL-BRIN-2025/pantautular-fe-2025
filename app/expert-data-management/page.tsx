"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Row = {
  data_id: string;
  file_name: string;
  last_edited: string;
  submitted_by: string;
};

export default function ExpertDataManagementPage({
  initialRows,
  initialError,
  simulateLoadError,
}: {
  initialRows?: Row[];
  initialError?: string | null;
  simulateLoadError?: boolean;
}) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- FILTER STATE ---
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      if (simulateLoadError) throw new Error("simulate load error");
      if (initialError) {
        setError(initialError);
        return;
      }
      if (Array.isArray(initialRows)) {
        setRows(initialRows);
        return;
      }

      const data: Row[] = [
        { data_id: "ID1", file_name: "Report_Jakarta.xlsx", last_edited: "2025-09-01 09:23:45", submitted_by: "EXPERTA" },
        { data_id: "ID2", file_name: "Survey_Bandung.csv", last_edited: "2025-09-05 11:12:30", submitted_by: "EXPERTB" },
        { data_id: "ID3", file_name: "Dataset_Sulsel.xls", last_edited: "2025-09-07 14:45:21", submitted_by: "EXPERTC" },
        { data_id: "ID4", file_name: "Health_Data_Sumatera.xlsx", last_edited: "2025-09-10 16:02:10", submitted_by: "EXPERTD" },
        { data_id: "ID5", file_name: "Malaria_Study.csv", last_edited: "2025-09-14 08:30:42", submitted_by: "EXPERTE" },
        { data_id: "ID6", file_name: "Vaccine_Report.xls", last_edited: "2025-09-18 12:17:55", submitted_by: "EXPERTA" },
        { data_id: "ID7", file_name: "COVID_Tracking.xlsx", last_edited: "2025-09-20 09:40:12", submitted_by: "EXPERTB" },
        { data_id: "ID8", file_name: "Tuberculosis_Study.csv", last_edited: "2025-09-23 10:58:03", submitted_by: "EXPERTC" },
        { data_id: "ID9", file_name: "Public_Health_Analysis.xlsx", last_edited: "2025-09-27 15:33:37", submitted_by: "EXPERTD" },
      ];
      setRows(data);
    } catch {
      setError("Failed to load data.");
    }
  }, [initialRows, initialError, simulateLoadError]);

  // Navigate and pass row info in the URL 
  const goView = (row: Row) => {
    const url = new URL(window.location.origin + "/expert-data-management/view");
    url.searchParams.set("id", row.data_id);
    url.searchParams.set("fileName", row.file_name);
    url.searchParams.set("lastEdited", row.last_edited);
    url.searchParams.set("submittedBy", row.submitted_by);
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((row) => row.data_id !== id));
  };

  // FILTERED VIEW (case-insensitive contains across all columns) 
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const id = r.data_id?.toLowerCase() ?? "";
      const fn = r.file_name?.toLowerCase() ?? "";
      const le = r.last_edited?.toLowerCase() ?? "";
      const sb = r.submitted_by?.toLowerCase() ?? "";
      return id.includes(q) || fn.includes(q) || le.includes(q) || sb.includes(q);
    });
  }, [rows, query]);

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">
          &lt; Expert / Dataset
        </div>

        {/* Filter Bar */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Saring berdasarkan ID Data, Nama Berkas, Terakhir Diedit, atau Dikumpul oleh"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E8AF6]"
            aria-label="Filter datasets"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl border shadow-sm bg-white overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed border-collapse">
            <thead className="bg-[#4A78E0] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[12%]">ID Data</th>
                <th className="px-4 py-3 text-left font-semibold w-[28%]">Nama Berkas</th>
                <th className="px-4 py-3 text-left font-semibold w-[24%]">Terakhir Diedit</th>
                <th className="px-4 py-3 text-left font-semibold w-[20%]">Dikumpul oleh</th>
                <th className="px-4 py-3 text-center font-semibold w-[16%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : filteredRows.length ? (
                filteredRows.map((r, idx) => (
                  <tr key={r.data_id || `row-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 break-words">{r.data_id}</td>
                    <td className="px-4 py-3 break-words">{r.file_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.last_edited}</td>
                    <td className="px-4 py-3">{r.submitted_by}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDelete(r.data_id)}
                          className="rounded-md border border-red-500 text-red-500 px-4 py-1 text-sm font-medium hover:bg-red-50 transition"
                        >
                          DELETE
                        </button>
                        <button
                          onClick={() => goView(r)}
                          className="rounded-md bg-[#2E66D4] text-white px-4 py-1 text-sm font-medium hover:brightness-95 transition"
                        >
                          VIEW
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 text-sm">
                    {query ? "No matching data." : "No data."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
