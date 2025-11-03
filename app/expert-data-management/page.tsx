"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";

const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");
type AccessState = "loading" | "redirect" | "forbidden" | "granted";

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
  const { user } = useAuth();

  // --- access state ---
  const [accessState, setAccessState] = useState<AccessState>("loading");

  useEffect(() => {
    let resolved = user;
    if (!resolved && typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("user");
        if (stored) resolved = JSON.parse(stored);
      } catch {}
    }
    if (!resolved) {
      setAccessState("redirect");
      return;
    }
    const allowed = normalizeRole(resolved.role) === "EXP_USER";
    setAccessState(allowed ? "granted" : "forbidden");
  }, [user]);

  useEffect(() => {
    if (accessState !== "redirect") return;
    const nextParam = encodeURIComponent("/expert-data-management");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);

  if (accessState === "loading" || accessState === "redirect") {
    return (
      <div className="min-h-screen bg-[#F3F7FB] flex items-center justify-center">
        <span className="text-sm text-gray-600">Memeriksa akses…</span>
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="min-h-screen bg-[#F3F7FB] flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AccessDeniedNotice />
        </main>
        <Footer />
      </div>
    );
  }

  // --- FILTER STATE ---
  const [query, setQuery] = useState("");

  // --- DATA STATE (✅ inside component) ---
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (simulateLoadError) {
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
        { data_id: "ID1", file_name: "Report_Jakarta.xlsx",         last_edited: "2025-09-01 09:23:45", submitted_by: "EXPERTA" },
        { data_id: "ID2", file_name: "Survey_Bandung.csv",          last_edited: "2025-09-05 11:12:30", submitted_by: "EXPERTB" },
        { data_id: "ID3", file_name: "Dataset_Sulsel.xls",          last_edited: "2025-09-07 14:45:21", submitted_by: "EXPERTC" },
        { data_id: "ID4", file_name: "Health_Data_Sumatera.xlsx",   last_edited: "2025-09-10 16:02:10", submitted_by: "EXPERTD" },
        { data_id: "ID5", file_name: "Malaria_Study.csv",           last_edited: "2025-09-14 08:30:42", submitted_by: "EXPERTE" },
        { data_id: "ID6", file_name: "Vaccine_Report.xls",          last_edited: "2025-09-18 12:17:55", submitted_by: "EXPERTA" },
        { data_id: "ID7", file_name: "COVID_Tracking.xlsx",         last_edited: "2025-09-20 09:40:12", submitted_by: "EXPERTB" },
        { data_id: "ID8", file_name: "Tuberculosis_Study.csv",      last_edited: "2025-09-23 10:58:03", submitted_by: "EXPERTC" },
        { data_id: "ID9", file_name: "Public_Health_Analysis.xlsx", last_edited: "2025-09-27 15:33:37", submitted_by: "EXPERTD" },
      ];
      setRows(data);
    } catch {
      setError("Failed to load data.");
    }
  }, [initialRows, initialError, simulateLoadError]);

  const goView = (row: Row) => {
    const url = new URL(window.location.origin + "/expert-data-management/view");
    url.searchParams.set("id", row.data_id);
    url.searchParams.set("fileName", row.file_name);
    url.searchParams.set("lastEdited", row.last_edited);
    url.searchParams.set("submittedBy", row.submitted_by);
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

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

        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by Data ID, File Name, Last Edited, or Submitted by"
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

        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] rounded-2xl">
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

              {error ? (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
              ) : filteredRows.length ? (
                <ul className="divide-y divide-gray-200">
                  {filteredRows.map((r) => (
                    <li key={r.data_id} className="hover:bg-gray-50">
                      <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3 break-words">{r.data_id}</div>
                        <div className="px-4 py-3">{r.file_name}</div>
                        <div className="px-4 py-3">{r.last_edited}</div>
                        <div className="px-4 py-3">{r.submitted_by}</div>
                        <div className="px-4 py-3 flex justify-center">
                          <button
                            onClick={() => goView(r)}
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
                <div className="text-center py-6 text-gray-500 text-sm">
                  {query ? "No matching data." : "No data."}
                </div>
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
