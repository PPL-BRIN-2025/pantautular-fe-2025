"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";

type CuratorRow = {
  id: number;
  data_id: string;
  title: string;
  last_edited?: string;   // snake_case (from DB)
  lastEdited?: string;    // camelCase (from serializer)
  submitted_by?: string;
  submittedBy?: string;
  note?: string;
};

export default function CuratorDataManagementPage() {
  const { user } = useAuth();
  const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");
  const role = normalizeRole(user?.role);
  const allowed = role === "CURATOR";

  const [data, setData] = useState<CuratorRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 8;

  useEffect(() => {
    if (!allowed) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: search.trim(),
          sort: "last_edited:desc",
        });

        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Token missing");

        const headersList = [
          { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        ];

        let res;
        for (const headers of headersList) {
          res = await fetch(`${API_BASE}/curator-feature/api/curator/audit-logs/?${params}`, {
            headers,
          });
          if (res.ok) break;
        }

        if (!res || !res.ok) throw new Error(`Server returned ${res?.status}`);

        const json = await res.json();
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (err: any) {
        console.error("Failed to fetch audit logs:", err);
        setError("Gagal mengambil data audit trail dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, search, allowed]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount) setPage(1);

  if (!user || !allowed) {
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

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">&lt; List Data</div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Cari ID / Title"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E8AF6]"
          />
          <button
            disabled
            className="bg-[#2E8AF6] text-white px-5 py-2 rounded-lg font-medium opacity-80 cursor-default"
          >
            Tambahkan Data
          </button>
        </div>

        {/* Table container */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] max-h-[70vh] overflow-y-auto rounded-2xl">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-[#2E8AF6] text-white rounded-t-2xl">
                <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] border-b border-white/30">
                  {["Data ID", "Title", "Last Edited", "Submitted by", "Action"].map(
                    (label, idx) => (
                      <div
                        key={label}
                        className={`px-4 py-3 text-sm sm:text-base font-semibold ${
                          idx !== 0 ? "border-l border-white/50" : ""
                        }`}
                      >
                        {label}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Table body */}
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-sm">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
              ) : data.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {data.map((r) => (
                    <li key={r.id} className="hover:bg-gray-50">
                      <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3 truncate">{r.data_id}</div>
                        <div className="px-4 py-3">{r.title}</div>
                        <div className="px-4 py-3">
                          {r.last_edited || r.lastEdited
                            ? new Date(r.last_edited || r.lastEdited!).toLocaleString("id-ID")
                            : "-"}
                        </div>
                        <div className="px-4 py-3">{r.submitted_by || r.submittedBy || "-"}</div>
                        <div className="px-4 py-3 flex justify-center">
                          <button
                            disabled
                            className="rounded-md bg-[#2E8AF6] text-white px-4 py-1 text-sm font-medium opacity-80 cursor-default"
                          >
                            Ubah
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Tidak ada data yang cocok.
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-4 sticky bottom-0 z-10 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Menampilkan{" "}
                  <span className="font-medium">{data.length}</span> dari{" "}
                  <span className="font-medium">{total}</span> data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                    {page} / {pageCount}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Sumber data: <code>/curator-feature/api/curator/audit-logs/</code> (tabel{" "}
          <code>curator_feature_datalog</code>).
        </p>
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
