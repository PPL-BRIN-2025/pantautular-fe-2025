"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/** ===== tipe sesuai tabel admin_feature_userlog ===== */
type LogRow = {
  id: number;
  username: string;
  email: string | null;
  timestamp: string;           // ISO
  action: string | null;
  detail: string | null;
  note?: string | null;
  created_at?: string;
};

type AllResp = { count: number; logs: LogRow[] };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const isTest = process.env.NODE_ENV === "test";

/* ===== Helpers ===== */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const k of ["access_token", "token", "accessToken", "jwt"]) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  if (API_KEY) h["X-API-KEY"] = String(API_KEY);
  return h;
}

function getNextPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/admin-user-log-menu";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** ===== Fetch ALL logs from AdminUserLog table ===== */
async function fetchAllLogs(): Promise<AllResp> {
  const res = await fetch(`${API_BASE}/admin-feature/api/admin/user-logs/all`, {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    const next = encodeURIComponent(getNextPath());
    if (typeof window !== "undefined") window.location.href = `/login?next=${next}`;
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    let detail = "Akses Ditolak";
    try {
      const j = await res.json();
      if (typeof (j as any)?.detail === "string") detail = (j as any).detail;
    } catch {}
    throw new Error(`403:${detail}`);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? " | " + txt : ""}`);
  }

  return res.json();
}

export default function AdminUserLogMenuPage() {
  // server state
  const [allRows, setAllRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [blocked403Detail, setBlocked403Detail] = useState<string | undefined>();

  // client filters + pagination
  const [searchInputText, setSearchInputText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // modal
  const [openId, setOpenId] = useState<number | null>(null);

  /** load all logs once */
  useEffect(() => {
    const go = async () => {
      setLoading(true);
      setErr(null);
      setBlocked403Detail(undefined);
      try {
        const data = await fetchAllLogs();
        // urutkan desc by timestamp (backend sudah desc, tapi jaga-jaga)
        const sorted = [...data.logs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAllRows(sorted);
      } catch (e: any) {
        const msg: string = e?.message ?? "";
        if (msg.startsWith("403:")) setBlocked403Detail(msg.slice(4) || "Akses Ditolak");
        else if (msg !== "Unauthorized") setErr(msg || "Gagal memuat");
        setAllRows([]);
      } finally {
        setLoading(false);
      }
    };
    go();
  }, []);

  /** client-side filter */
  const filtered = useMemo(() => {
    const q = searchInputText.trim().toLowerCase();
    const startTs = startDate ? startDate.getTime() : null;
    const endTs = endDate ? endDate.getTime() : null;

    return allRows.filter((r) => {
      // search in username, email, action, detail
      const hay = `${r.username ?? ""} ${r.email ?? ""} ${r.action ?? ""} ${r.detail ?? ""}`.toLowerCase();
      if (q && !hay.includes(q)) return false;

      const t = new Date(r.timestamp).getTime();
      if (startTs && t < startTs) return false;
      if (endTs && t > endTs) return false;

      return true;
    });
  }, [allRows, searchInputText, startDate, endDate]);

  // client pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    // reset ke page 1 kalau filter berubah
    setPage(1);
  }, [searchInputText, startDate, endDate]);

  if (!isTest && blocked403Detail) {
    return (
      <div className="min-h-screen bg-[#F3F7FB]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="text-sm font-semibold text-amber-700">Informasi Akses</div>
            <div className="mt-2 text-2xl font-semibold text-amber-900">Akses Ditolak</div>
            <p className="mt-2 text-sm text-amber-800">
              Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau masuk sebagai admin.
            </p>
            {blocked403Detail && blocked403Detail !== "Akses Ditolak" && (
              <p className="mt-2 text-xs text-amber-700/90">{blocked403Detail}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Kembali</Link>
              <Link href={`/login?next=${encodeURIComponent(getNextPath())}`} className="rounded-lg bg-[#0069CF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Masuk</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      {!isTest && <Navbar />}

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">

        {err && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

        {/* Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl bg-white p-2 sm:p-2.5 shadow-sm ring-1 ring-gray-200">
            <input
              type="text"
              placeholder="Cari username/email/action/detail…"
              value={searchInputText}
              onChange={(e) => setSearchInputText(e.target.value)}
              className="h-9 sm:h-10 flex-1 min-w-[220px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Dari</span>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                placeholderText="dd/mm/yy"
                dateFormat="dd/MM/yy"
                className="h-9 sm:h-10 w-[120px] sm:w-[140px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-1 sm:ml-2 text-sm text-gray-600">Sampai</span>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                placeholderText="dd/mm/yy"
                dateFormat="dd/MM/yy"
                className="h-9 sm:h-10 w-[120px] sm:w-[140px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] max-h-[70vh] overflow-y-auto rounded-2xl">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-blue-500 text-white rounded-t-2xl">
                <div className="grid grid-cols-[1fr_1.6fr_1.2fr_1fr_2fr] border-b border-white/30">
                  {["Username","Email","Timestamp","Action","Detail"].map((label, idx) => (
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

              {pageRows.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {pageRows.map((r) => (
                    <li key={r.id} className="hover:bg-gray-50">
                      <div className="grid grid-cols-[1fr_1.6fr_1.2fr_1fr_2fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3">{r.username || "-"}</div>
                        <div className="px-4 py-3 truncate">{r.email || "-"}</div>
                        <div className="px-4 py-3 tabular-nums">{fmtDate(r.timestamp)}</div>
                        <div className="px-4 py-3">{r.action || "-"}</div>
                        <div className="px-4 py-3 truncate" title={r.detail || ""}>{r.detail || "-"}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-10 text-center text-gray-500">
                  {loading ? "Loading…" : "Tidak ada data"}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-4">
                <p className="text-xs text-gray-600">
                  Menampilkan <span className="font-medium">{pageRows.length}</span> dari{" "}
                  <span className="font-medium">{filtered.length}</span> (total: {allRows.length})
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
                    {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= Math.ceil(filtered.length / pageSize)}
                    onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        <p className="mt-4 text-xs text-gray-500">
          Sumber data: <code>/admin-feature/api/admin/user-logs/all</code> (tabel <code>admin_feature_userlog</code>).
        </p>
      </main>

      {!isTest && (
        <div className="mt-10">
          <Footer />
        </div>
      )}

    </div>
  );
}