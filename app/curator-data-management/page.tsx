"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";

type CuratorRow = {
  id: number | string;
  data_id: string;
  title: string;
  last_edited?: string; // snake_case (DB)
  lastEdited?: string;  // camelCase (serializer)
  submitted_by?: string;
  submittedBy?: string;
  note?: string;
};

export default function CuratorDataManagementPage() {
  const router = useRouter();
  const { user } = useAuth();

  const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");
  const role = normalizeRole(user?.role);
  const allowed = role === "CURATOR";

  // ---- API base detection (prod via env, dev same-origin) ----
  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
    []
  );
  const isSameOrigin = API_BASE.length === 0;

  // ---- UI State ----
  const [data, setData] = useState<CuratorRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // ---- helpers ----
  const fmtIDDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : d.toLocaleString("id-ID");
  };

  const buildURL = () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search: search.trim(),
      sort: "last_edited:desc",
    });
    // when API_BASE empty -> same-origin call (dev proxy)
    return `${API_BASE}/curator-feature/api/curator/audit-logs/?${params.toString()}`;
  };

  // ---- fetch logs ----
  useEffect(() => {
    if (!allowed) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = buildURL();
        const token = localStorage.getItem("accessToken") || "";

        // First try: Bearer token (works for Koyeb/backend CORS)
        let res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: isSameOrigin ? "include" : "omit",
          mode: "cors",
        });

        // Fallback: cookie-only (for same-origin dev setups)
        if (res.status === 401 && isSameOrigin) {
          res = await fetch(url, {
            credentials: "include",
            mode: "cors",
          });
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setData(Array.isArray(json.data) ? json.data : []);
        setTotal(Number(json.total) || 0);

        // If page exceeds pageCount after server reply, reset to 1
        const newPageCount = Math.max(1, Math.ceil((Number(json.total) || 0) / pageSize));
        if (page > newPageCount) setPage(1);
      } catch (e) {
        console.error("Audit logs fetch failed:", e);
        setError("Gagal mengambil data audit trail dari server.");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, allowed, API_BASE]);

  // ---- guards ----
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

  // ---- navigation ----
  const goAdd = () => router.push("/curator-add-data");
  const goEdit = (dataId: string) => router.push(`/curator-edit-delete-data?id=${encodeURIComponent(dataId)}`);

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">&lt; List Data</div>

        {/* Search + Add */}
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
            onClick={goAdd}
            className="bg-[#2E8AF6] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#256fd4] transition"
          >
            Tambahkan Data
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] max-h-[70vh] overflow-y-auto rounded-2xl">
              {/* Header */}
              <div className="sticky top-0 z-20 bg-[#2E8AF6] text-white rounded-t-2xl">
                <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] border-b border-white/30">
                  {["Data ID", "Title", "Last Edited", "Submitted by", "Action"].map((label, idx) => (
                    <div
                      key={label}
                      className={`px-4 py-3 text-sm sm:text-base font-semibold ${
                        idx !== 0 ? "border-l border-white/50" : ""
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-sm">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
              ) : data.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {data.map((r) => {
                    const submittedBy = r.submitted_by ?? r.submittedBy ?? "-";
                    const edited = fmtIDDate(r.last_edited ?? r.lastEdited);
                    return (
                      <li key={`${r.id}-${r.data_id}`} className="hover:bg-gray-50">
                        <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                          <div className="px-4 py-3 truncate">{r.data_id}</div>
                          <div className="px-4 py-3">{r.title}</div>
                          <div className="px-4 py-3">{edited}</div>
                          <div className="px-4 py-3">{submittedBy}</div>
                          <div className="px-4 py-3 flex justify-center">
                            <button
                              onClick={() => goEdit(r.data_id)}
                              className="rounded-md bg-[#2E8AF6] text-white px-4 py-1 text-sm font-medium hover:bg-[#256fd4] transition"
                            >
                              Ubah
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">Tidak ada data yang cocok.</div>
              )}

              {/* Footer / Pagination */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-4 sticky bottom-0 z-10 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Menampilkan <span className="font-medium">{data.length}</span> dari{" "}
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
