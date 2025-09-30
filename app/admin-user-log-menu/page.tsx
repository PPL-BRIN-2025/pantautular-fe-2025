"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type UserRow = { id: number; name: string; email: string; last_login: string | null };
type Query = {
  page?: number; pageSize?: number; search?: string; start?: string; end?: string;
  sort?: "last_login:asc" | "last_login:desc";
};
type Resp = { data: UserRow[]; page: number; pageSize: number; total: number };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
  if (process.env.NEXT_PUBLIC_API_KEY) h["X-API-KEY"] = String(process.env.NEXT_PUBLIC_API_KEY);
  return h;
}

function getNextPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/admin-user-log-menu";
}

async function fetchUsers(params: Query): Promise<Resp> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.sort) qs.set("sort", params.sort);

  const res = await fetch(`${API}/api/admin/user-logs/?${qs.toString()}`, {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    const next = encodeURIComponent(getNextPath());
    window.location.href = `/login?next=${next}`;
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    let detail = "Akses Ditolak";
    try {
      const j = await res.json();
      detail = (j as any)?.detail || detail;
    } catch {}
    throw new Error(`403:${detail}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${detail ? " | " + detail : ""}`);
  }
  return res.json();
}

// ===== Utils =====
function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function StatusBadge({ detail }: { detail: string }) {
  const cls = detail === "Login success" ? "text-green-600" : detail === "Login Failed" ? "text-red-700" : "text-yellow-500";
  return <span className={`font-normal ${cls}`}>{detail}</span>;
}

// page
export default function AdminUserLogMenuPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [blocked403Detail, setBlocked403Detail] = useState<string | undefined>();

  // filters
  const [searchInputText, setSearchInputText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // modal
  const [openId, setOpenId] = useState<number | null>(null);
  const opened = rows.find((r) => r.id === openId) || null;

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const DEFAULT_ACTIVITY = "Login success";

  const run = async (p?: Partial<Query>) => {
    setLoading(true);
    setErr(null);
    setBlocked403Detail(undefined);
    try {
      const res = await fetchUsers({
        page,
        pageSize,
        search: searchInputText || undefined,
        start: startDate ? startDate.toISOString() : undefined,
        end: endDate ? endDate.toISOString() : undefined,
        sort: "last_login:desc",
        ...(p || {}),
      });
      setRows(res.data);
      setTotal(res.total);
      if (p?.page) setPage(p.page);
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg.startsWith("403:")) {
        setBlocked403Detail(msg.slice(4) || "Akses Ditolak");
      } else if (msg !== "Unauthorized") {
        setErr(msg || "Gagal memuat");
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    setPage(1);
    run({ page: 1 });
  }

  // ===== If NO ACCESS, show the amber card (hide table entirely) =====
  if (blocked403Detail) {
    return (
      <div className="min-h-screen bg-[#F3F7FB]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="text-sm font-semibold text-amber-700">Informasi Akses</div>
            <div className="mt-2 text-2xl font-semibold text-amber-900">You do not have permission to perform this action.</div>
            <p className="mt-2 text-sm text-amber-800">
              Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau masuk sebagai admin.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Kembali
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(getNextPath())}`}
                className="rounded-lg bg-[#0069CF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Masuk
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== Normal page (has access) =====
  const visibleRows = rows;

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl bg-white p-2 sm:p-2.5 shadow-sm ring-1 ring-gray-200">
            <input
              type="text"
              placeholder="Cari user..."
              value={searchInputText}
              onChange={(e) => setSearchInputText(e.target.value)}
              className="h-9 sm:h-10 flex-1 min-w-[200px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Dari</span>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                placeholderText="dd/mm/yy"
                dateFormat="dd/MM/yy"
                className="h-9 sm:h-10 w-[110px] sm:w-[140px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-1 sm:ml-2 text-sm text-gray-600">Sampai</span>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                placeholderText="dd/mm/yy"
                dateFormat="dd/MM/yy"
                className="h-9 sm:h-10 w-[110px] sm:w-[140px] rounded-md bg-gray-100 px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={applyFilters}
              className="ml-auto h-9 sm:h-10 rounded-xl bg-blue-500 px-4 sm:px-5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              <div className="bg-blue-500 text-white ring-1 ring-black rounded-t-[10px]">
                <div className="grid grid-cols-[1.2fr_1.6fr_1.2fr_1.1fr_0.6fr]">
                  {["Username", "Email", "Date", "Activity", "Action"].map((label, idx) => (
                    <div
                      key={label}
                      className={`px-4 py-2.5 sm:py-3 text-sm sm:text-base leading-loose font-normal ${
                        idx === 0 ? "" : "border-l border-white/80"
                      }`}
                    >
                      {idx === 4 ? <span className="block text-right">{label}</span> : label}
                    </div>
                  ))}
                </div>
              </div>

              {visibleRows.length > 0 ? (
                <ul className="divide-y">
                  {visibleRows.map((r) => (
                    <li key={r.id} className="px-4 py-4 sm:py-5 hover:bg-gray-50">
                      <div className="grid grid-cols-[1.2fr_1.6fr_1.2fr_1.1fr_0.6fr] items-center">
                        <div className="text-black text-sm sm:text-base leading-loose">{r.name}</div>
                        <div className="text-black text-sm sm:text-base leading-loose truncate">{r.email}</div>
                        <div className="text-black text-sm sm:text-base leading-loose tabular-nums">
                          {fmtDate(r.last_login)}
                        </div>
                        <div className="text-sm sm:text-base leading-loose">
                          <StatusBadge detail={"Login success"} />
                        </div>
                        <div className="text-right">
                          <button
                            className="text-black text-xl sm:text-2xl leading-loose px-2 py-1 hover:bg-gray-100 rounded-lg"
                            aria-label="lihat detail"
                            title="Lihat detail"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-10 text-center text-gray-500">
                  {loading ? "Loading…" : "Tidak ada data"}
                </div>
              )}

              <div className="flex items-center justify-between bg-white p-3 sm:p-4">
                <p className="text-xs text-gray-600">
                  Menampilkan <span className="font-medium">{visibleRows.length}</span> dari{" "}
                  <span className="font-medium">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => {
                      const p = Math.max(1, page - 1);
                      setPage(p);
                      run({ page: p });
                    }}
                  >
                    Prev
                  </button>
                  <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                    {page} / {Math.max(1, Math.ceil(total / pageSize))}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                    onClick={() => {
                      const p = Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1);
                      setPage(p);
                      run({ page: p });
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">Klik baris untuk melihat detail user.</p>
      </main>

      <Footer />
    </div>
  );
}

export { fetchUsers as fetchUserLogs };
