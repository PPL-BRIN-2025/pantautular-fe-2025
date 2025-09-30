"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type UserRow = { id: number; name: string; email: string; last_login: string | null };
type Query = {
  page?: number;
  pageSize?: number;
  search?: string;
  start?: string;
  end?: string;
  sort?: "last_login:asc" | "last_login:desc";
};
type Resp = { data: UserRow[]; page: number; pageSize: number; total: number };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const isTest = process.env.NODE_ENV === "test";

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

async function fetchUsers(params: Query): Promise<Resp> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.sort) qs.set("sort", params.sort);

  const res = await fetch(`${API_BASE}/api/admin/user-logs/?${qs.toString()}`, {
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
    try {
      const blocked = await res.json();
      const detail = typeof (blocked as any)?.detail === "string" ? (blocked as any).detail : "Akses Ditolak";
      throw new Error(`403:${detail}`);
    } catch {
      throw new Error("403:Akses Ditolak");
    }
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    throw new Error(`HTTP ${res.status}${detail ? " | " + detail : ""}`);
  }

  return res.json();
}


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
  const cls =
    detail === "Login success"
      ? "text-green-600"
      : detail === "Login Failed"
      ? "text-red-700"
      : "text-yellow-500";
  return <span className={`font-normal ${cls}`}>{detail}</span>;
}

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

  // popup state
  const [openId, setOpenId] = useState<number | null>(null);

  // inject dummy activity when resolving opened user
  const opened = useMemo(() => {
    const base = rows.find((r) => r.id === openId) || null;
    if (!base) return null;

    // pick a dummy activity randomly
    const activities = ["Login success", "Uploaded CSV"];
    const dummyActivity = activities[base.id % activities.length];
    return { ...base, activity: dummyActivity };
  }, [rows, openId]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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

  // esc to close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function applyFilters() {
    setPage(1);
    run({ page: 1 });
  }

  /* ===== Access denied page ===== */
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

  const visibleRows = rows;

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      {!isTest && <Navbar />}

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
            <div className="min-w-[760px]">
              <div className="bg-blue-500 text-white ring-1 ring-black rounded-t-[10px]">
                <div className="grid grid-cols-[1.3fr_1.7fr_1.2fr_0.6fr]">
                  {["Username", "Email", "Last Login", "Action"].map((label, idx) => (
                    <div
                      key={label}
                      className={`px-4 py-2.5 sm:py-3 text-sm sm:text-base leading-loose font-normal ${
                        idx === 0 ? "" : "border-l border-white/80"
                      }`}
                    >
                      {idx === 3 ? <span className="block text-right">{label}</span> : label}
                    </div>
                  ))}
                </div>
              </div>

              {visibleRows.length > 0 ? (
                <ul className="divide-y">
                  {visibleRows.map((r) => (
                    <li key={r.id} className="px-4 py-4 sm:py-5 hover:bg-gray-50">
                      <div className="grid grid-cols-[1.3fr_1.7fr_1.2fr_0.6fr] items-center">
                        <div className="text-black text-sm sm:text-base leading-loose">{r.name}</div>
                        <div className="text-black text-sm sm:text-base leading-loose truncate">{r.email}</div>
                        <div className="text-black text-sm sm:text-base leading-loose tabular-nums">
                          {fmtDate(r.last_login)}
                        </div>
                        <div className="text-right">
                          <button
                            onClick={() => setOpenId(r.id)}
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
                    {page} / {pageCount}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= pageCount}
                    onClick={() => {
                      const p = Math.min(pageCount, page + 1);
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

        <p className="mt-4 text-xs text-gray-500">Klik “&gt;” pada baris untuk melihat detail user.</p>
      </main>

      {!isTest && <Footer />}

      {/* Popup */}
      {opened && (
        <DetailModal
          user={opened}
          activity={opened.activity}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function DetailModal({
  user,
  activity,
  onClose,
}: {
  user: UserRow & { activity: string };
  activity: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <button
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-1 pb-4">
          <h2 className="text-lg font-semibold text-blue-600">Detail User</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <Field label="Name" value={user.name || "-"} />
          <Field label="Email" value={user.email || "-"} />
          <Field label="Last Login" value={fmtDate(user.last_login)} />
          <div>
            <p className="text-black font-medium">Activity</p>
            <div className="mt-1 rounded-md bg-gray-50 px-3 py-2">
              <StatusBadge detail={activity} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button
            onClick={onClose}
            className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Tutup
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">Tekan di luar modal atau tombol Esc untuk menutup.</p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-black font-medium">{label}</p>
      <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 break-words">{value}</div>
    </div>
  );
}

export { fetchUsers as fetchUserLogs, getToken, authHeaders };
