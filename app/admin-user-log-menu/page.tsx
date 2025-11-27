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
    const startTs = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()
      : null;
    const endTs = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
      : null;

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
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const uniqueUsers = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => {
      if (r.username) s.add(r.username);
      else if (r.email) s.add(r.email);
    });
    return s.size;
  }, [allRows]);

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
    <div className="min-h-screen bg-gradient-to-b from-[#f2f7ff] via-[#f7faff] to-white text-slate-900">
      {!isTest && <Navbar />}

      <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d63d5] via-[#0c55b6] to-[#0a4496] p-6 sm:p-8 text-white shadow-xl shadow-blue-200/50">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                  Audit Log
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">Admin User Log</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  Pantau aktivitas pengguna admin dengan tampilan yang rapi dan fokus pada informasi penting.
                </p>
              </div>
              <div className="grid w-full sm:w-auto grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 shadow-sm shadow-black/10 backdrop-blur">
                  <p className="text-xs font-medium text-white/80">Total Log</p>
                  <p className="text-lg font-semibold">{allRows.length}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 shadow-sm shadow-black/10 backdrop-blur">
                  <p className="text-xs font-medium text-white/80">Terfilter</p>
                  <p className="text-lg font-semibold">{filtered.length}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 shadow-sm shadow-black/10 backdrop-blur">
                  <p className="text-xs font-medium text-white/80">User Unik</p>
                  <p className="text-lg font-semibold">{uniqueUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-36">

        {err && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

        {/* Filter */}
        <section className="mb-5 sm:mb-8">
          <div className="relative rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0e7ae6] via-[#0c63c4] to-[#0b4fa6]" />
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b4fa6]">Filter</p>
                  <p className="text-sm text-slate-600">Cari aktivitas dengan cepat berdasarkan kata kunci atau rentang tanggal.</p>
                </div>
                <button
                  onClick={() => {
                    setSearchInputText("");
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f7df3] to-[#0d6ad1] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-300/40 transition hover:brightness-105"
                >
                  Reset Filter
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.15fr_1fr]">
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 shadow-inner shadow-blue-100/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0b4fa6] shadow-sm shadow-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M11 11L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8.5" cy="8.5" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari username / email / action / detail..."
                    value={searchInputText}
                    onChange={(e) => setSearchInputText(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-blue-100 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#0f7df3] focus:ring-2 focus:ring-[#9cc9ff]"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 shadow-inner shadow-blue-100/60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0b4fa6] shadow-sm shadow-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M15 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M4 10H20" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#0b4fa6]">Dari</div>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        popperClassName="z-40"
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="dd/mm/yy"
                        dateFormat="dd/MM/yy"
                        className="h-11 w-[130px] rounded-xl border border-blue-100 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#0f7df3] focus:ring-2 focus:ring-[#9cc9ff]"
                      />
                      <span className="text-sm font-semibold text-[#0b4fa6]">-</span>
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#0b4fa6]">Sampai</div>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        popperClassName="z-40"
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate || undefined}
                        placeholderText="dd/mm/yy"
                        dateFormat="dd/MM/yy"
                        className="h-11 w-[130px] rounded-xl border border-blue-100 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#0f7df3] focus:ring-2 focus:ring-[#9cc9ff]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-2xl shadow-blue-100/40 backdrop-blur">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] max-h-[70vh] overflow-y-auto">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-gradient-to-r from-[#0f63d2] to-[#0b4ea5] text-white shadow-md">
                <div className="grid grid-cols-[1fr_1.6fr_1.2fr_1fr_2fr] border-b border-white/20">
                  {["Username","Email","Timestamp","Action","Detail"].map((label, idx) => (
                    <div
                      key={label}
                      className={`px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide ${
                        idx !== 0 ? "border-l border-white/30" : ""
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {pageRows.length > 0 ? (
                <ul className="divide-y divide-blue-50">
                  {pageRows.map((r) => (
                    <li key={r.id} className="transition hover:bg-blue-50/60">
                      <div className="grid grid-cols-[1fr_1.6fr_1.2fr_1fr_2fr] items-center text-sm sm:text-base">
                        <div className="px-4 py-3 font-semibold text-slate-800">{r.username || "-"}</div>
                        <div className="px-4 py-3 truncate text-slate-600">{r.email || "-"}</div>
                        <div className="px-4 py-3 tabular-nums text-slate-600">{fmtDate(r.timestamp)}</div>
                        <div className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0b4fa6] shadow-inner shadow-blue-100/70">
                            {r.action || "-"}
                          </span>
                        </div>
                        <div className="px-4 py-3 truncate text-slate-600" title={r.detail || ""}>{r.detail || "-"}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-10 text-center text-slate-500">
                  {loading ? "Loading..." : "Tidak ada data"}
                </div>
              )}

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/95 px-3 sm:px-4 py-4">
                <p className="text-xs text-slate-600">
                  Menampilkan <span className="font-semibold text-[#0b4fa6]">{pageRows.length}</span> dari{" "}
                  <span className="font-medium">{filtered.length}</span> (total: {allRows.length})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-blue-100 px-3 py-1.5 text-sm text-[#0b4fa6] transition hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#0b4fa6]">
                    {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                  </div>
                  <button
                    className="rounded-lg border border-blue-100 px-3 py-1.5 text-sm text-[#0b4fa6] transition hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white"
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
