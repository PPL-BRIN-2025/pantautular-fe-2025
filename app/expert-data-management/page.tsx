"use client";

import { useEffect, useState } from "react";
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
}: {
  initialRows?: Row[];
  initialError?: string | null;
  simulateLoadError?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof (arguments as any)[0]?.simulateLoadError !== "undefined" && (arguments as any)[0]?.simulateLoadError) {
        // intentional throw to exercise catch branch in tests
        throw new Error("simulate load error");
      }
      if (typeof initialError !== "undefined" && initialError !== null) {
        setError(initialError);
        return;
      }

      if (Array.isArray(initialRows)) {
        setRows(initialRows);
        return;
      }

      const data: Row[] = [
        { data_id: "ID1", file_name: "Report_Jakarta.xlsx",        last_edited: "2025-09-01 09:23:45", submitted_by: "EXPERTA" },
        { data_id: "ID2", file_name: "Survey_Bandung.csv",         last_edited: "2025-09-05 11:12:30", submitted_by: "EXPERTB" },
        { data_id: "ID3", file_name: "Dataset_Sulsel.xls",         last_edited: "2025-09-07 14:45:21", submitted_by: "EXPERTC" },
        { data_id: "ID4", file_name: "Health_Data_Sumatera.xlsx",  last_edited: "2025-09-10 16:02:10", submitted_by: "EXPERTD" },
        { data_id: "ID5", file_name: "Malaria_Study.csv",          last_edited: "2025-09-14 08:30:42", submitted_by: "EXPERTE" },
        { data_id: "ID6", file_name: "Vaccine_Report.xls",         last_edited: "2025-09-18 12:17:55", submitted_by: "EXPERTA" },
        { data_id: "ID7", file_name: "COVID_Tracking.xlsx",        last_edited: "2025-09-20 09:40:12", submitted_by: "EXPERTB" },
        { data_id: "ID8", file_name: "Tuberculosis_Study.csv",     last_edited: "2025-09-23 10:58:03", submitted_by: "EXPERTC" },
        { data_id: "ID9", file_name: "Public_Health_Analysis.xlsx",last_edited: "2025-09-27 15:33:37", submitted_by: "EXPERTD" },
      ];
      setRows(data);
    } catch {
      setError("Failed to load data.");
    }
  }, []);

  const goView = (id: string) => router.push(`/expert-view?id=${id}`);

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">&lt; Expert / Dataset</div>

        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] rounded-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#4A78E0] text-white rounded-t-2xl">
                <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr]">
                  {["Data ID", "File Name", "Last Edited", "Submitted by", "Action"].map((label, idx) => (
                    <div
                      key={label}
                      className={`px-4 py-3 text-sm sm:text-base font-semibold ${idx !== 0 ? "border-l border-white/40" : ""}`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              {error ? (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
              ) : rows.length ? (
                <ul className="divide-y divide-gray-200">
                  {rows.map((r) => (
                    <li key={r.data_id} className="hover:bg-gray-50">
                      <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3 break-words">{r.data_id}</div>
                        <div className="px-4 py-3">{r.file_name}</div>
                        <div className="px-4 py-3">{r.last_edited}</div>
                        <div className="px-4 py-3">{r.submitted_by}</div>
                        <div className="px-4 py-3 flex justify-center">
                          <button
                            onClick={() => goView(r.data_id)}
                            className="rounded-md bg-[#2E66D4] text-white px-4 py-1 text-sm font-medium hover:brightness-95 transition"
                          >
                            VIEW
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">No data.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
