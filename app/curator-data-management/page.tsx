"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";
import { API_BASE } from "../../config";

type CuratorRow = {
  id?: number;
  data_id: string;
  title: string;
  last_edited?: string;
  lastEdited?: string;
  submitted_by?: string;
  submittedBy?: string;
  note?: string;
};

const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");

type AccessState = "loading" | "redirect" | "forbidden" | "granted";

export default function CuratorDataManagementPage() {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();

  const [accessState, setAccessState] = useState<AccessState>("loading");

  // ---- ACCESS GATE ----
  useEffect(() => {
    let resolved = user as any;
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

    const role = normalizeRole(resolved.role);
    const allowed = role === "CURATOR" || role === "ADMIN"|| role === "EXP_USER";
    setAccessState(allowed ? "granted" : "forbidden");
  }, [user]);

  useEffect(() => {
    if (accessState !== "redirect") return;
    const nextParam = encodeURIComponent("/curator-data-management");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);

  // ---- COMPONENT STATE ----
  const [data, setData] = useState<CuratorRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rawSearch, setRawSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string | null>(null);

  const pageSize = 8;
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const firstClamp = useRef(true);
  useEffect(() => {
    if (!firstClamp.current && page > pageCount) setPage(pageCount);
    firstClamp.current = false;
  }, [pageCount, page]);

  // ---- DATA FETCH ----
  useEffect(() => {
    if (accessState !== "granted") return;

    const ac = new AbortController();

    const key = `${page}|${pageSize}|${rawSearch.trim()}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          search: rawSearch.trim(),
          sort: "last_edited:desc",
        });

        let token: string | null = null;
        try {
          token = typeof getAccessToken === "function" ? await getAccessToken() : null;
        } catch {
          token = null;
        }
        if (!token && typeof window !== "undefined") {
          token = window.localStorage.getItem("accessToken");
        }

        const url = `${API_BASE}/curator-feature/api/curator/audit-logs/?${params}`;
        let res: Response | undefined;
        let bodyText = "";

        const readBody = async (response?: Response) => {
          if (!response) return "";
          const text = (response as any)?.text;
          if (typeof text === "function") {
            try {
              return await text.call(response);
            } catch {
              return "";
            }
          }
          return "";
        };

        if (token) {
          const r = await fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            signal: ac.signal,
          });
          res = r;
          bodyText = await readBody(typeof (r as any)?.clone === "function" ? (r as any).clone() : r);
        } else {
          const r = await fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "no-store",
            credentials: "include",
            signal: ac.signal,
          });
          res = r;
          bodyText = await readBody(typeof (r as any)?.clone === "function" ? (r as any).clone() : r);
        }

        if (!res) throw new Error("No response");

        if (res.status === 401) {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem("accessToken");
            } catch {}
          }
          setData([]);
          setTotal(0);
          setError("Sesi berakhir. Silakan login ulang.");
          const nextParam = encodeURIComponent("/curator-data-management");
          router.replace(`/login?next=${nextParam}`);
          return;
        }

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${bodyText || "Unknown error"}`);
        }

        const json = bodyText ? JSON.parse(bodyText) : {};
        const rows = Array.isArray(json?.data) ? (json.data as CuratorRow[]) : [];
        setData(rows);
        setTotal(Number(json?.total ?? rows.length ?? 0));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("Fetch audit logs failed:", e);
        setError("Gagal mengambil data audit trail dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    return () => ac.abort();
  }, [accessState, page, pageSize, rawSearch, router, getAccessToken]);

  // ---- EARLY RETURNS ----
  if (accessState === "loading" || accessState === "redirect") {
    return (
      <div className="min-h-screen bg-[#F3F7FB]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <span className="text-sm text-gray-700">Memeriksa akses…</span>
        </div>
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

  // ---- NORMAL RENDER ----
  const goAdd = () => router.push("/curator-add-data");
  const goEdit = (id: string) => router.push(`/curator-edit-delete-data?id=${id}`);

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">&lt; Daftar Data</div>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Cari ID / Judul"
            value={rawSearch}
            onChange={(e) => {
              setRawSearch(e.target.value);
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
                  {["ID Data", "Judul", "Terakhir Diubah", "Dikumpulkan Oleh", "Aksi"].map(
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

              {/* Body */}
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-sm">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
              ) : data.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {data.map((r) => {
                    const when = r.last_edited || r.lastEdited;
                    const who = r.submitted_by || r.submittedBy || "-";
                    return (
                      <li key={r.data_id} className="hover:bg-gray-50">
                        <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3 break-words">
                          {r.data_id ? `${r.data_id.slice(0, 12)}...` : "-"}
                        </div>

                          <div className="px-4 py-3">{r.title}</div>
                          <div className="px-4 py-3">
                            {when ? new Date(when).toLocaleString("id-ID") : "-"}
                          </div>
                          <div className="px-4 py-3">{who}</div>
                          <div className="px-4 py-3 flex justify-center">
                            <button
                              onClick={() => goEdit(r.data_id)}
                              className="rounded-md bg-[#2E8AF6] text-white px-4 py-1 text-sm font-medium hover:bg-[#256fd4] transition"
                            >
                              Lihat Data
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Tidak ada data yang cocok.
                </div>
              )}

              {/* Pagination */}
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
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
