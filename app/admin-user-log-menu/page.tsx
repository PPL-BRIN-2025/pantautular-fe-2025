"use client";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../components/Navbar";

// types
type UserLog = {
  id: string;
  username: string;
  email: string;
  timestamp: string;
  detail: "Login success" | "Login Failed" | "Change Role" | string;
  note?: string;
};

type Query = { page?: number; pageSize?: number };
type Resp = { data: UserLog[]; page: number; pageSize: number; total: number };

// inserting the real fetch from the database, probably wont work
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function fetchUserLogs(params: Query): Promise<Resp> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.sort) qs.set("sort", params.sort);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.NEXT_PUBLIC_API_KEY;
  // if (key) headers["x-api-key"] = key; // gonna add this later

  const res = await fetch(`${API}/api/admin/user-logs/?${qs}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Resp;
}

// helpers
function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

// page
export default function UserLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserLog[]>([]);
  const [total, setTotal] = useState(0);

  // filters
  const [searchInputText, setSearchInputText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // modal
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = rows.find((r) => r.id === openId) || null;

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const run = async (p?: Partial<Query>) => {
    setLoading(true);
    try {
      const res = await fetchUserLogs({ page, pageSize, ...(p || {}) });
      setRows(res.data);
      setTotal(res.total);
      if (p?.page) setPage(p.page);
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

  // filter utils
  function resetFilters() {
    setSearchInputText("");
    setStartDate(null);
    setEndDate(null);
    run();
  }

  function filterRows() {
    let filtered = [...rows];

    if (searchInputText) {
      const q = searchInputText.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.username.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.detail.toLowerCase().includes(q)
      );
    }

    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        const t = new Date(r.timestamp);
        const after = !startDate || t >= startDate;
        const before = !endDate || t <= endDate;
        return after && before;
      });
    }

    return filtered;
  }

  const visibleRows = filterRows();

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans">
      <Navbar />

      {/* CONTAINER */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Filter Section */}
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
              onClick={resetFilters}
              className="ml-auto h-9 sm:h-10 rounded-xl bg-blue-500 px-4 sm:px-5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {/* Header */}
              <div className="bg-blue-500 text-white ring-1 ring-black rounded-t-[10px]">
                <div className="grid grid-cols-[1.2fr_1.6fr_1.4fr_1.1fr_0.6fr]">
                  {["Username", "Email", "Date", "Detail", "Action"].map((label, idx) => (
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

              {/* Body */}
              {visibleRows.length > 0 ? (
                <ul className="divide-y">
                  {visibleRows.map((r) => (
                    <li key={r.id} className="px-4 py-4 sm:py-5 hover:bg-gray-50">
                      <div className="grid grid-cols-[1.2fr_1.6fr_1.4fr_1.1fr_0.6fr] items-center">
                        <div className="text-black text-sm sm:text-base leading-loose">{r.username}</div>
                        <div className="text-black text-sm sm:text-base leading-loose truncate">{r.email}</div>
                        <div className="text-black text-sm sm:text-base leading-loose tabular-nums">
                          {fmtDate(r.timestamp)}
                        </div>
                        <div className="text-sm sm:text-base leading-loose">
                          <StatusBadge detail={r.detail} />
                        </div>
                        <div className="text-right">
                          <button
                            className="text-black text-xl sm:text-2xl leading-loose px-2 py-1 hover:bg-gray-100 rounded-lg"
                            aria-label="lihat detail"
                            onClick={() => setOpenId(r.id)}
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

              {/* Pagination */}
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

        <p className="mt-4 text-xs text-gray-500">Klik baris untuk melihat detail log.</p>
      </div>

      {/* Modal */}
      {opened && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-600">Detail Aktivitas</h3>
              <button
                className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => setOpenId(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-black font-medium">Nama</p>
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2">{opened.username}</div>
              </div>
              <div>
                <p className="text-black font-medium">Email</p>
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2">{opened.email}</div>
              </div>
              <div>
                <p className="text-black font-medium">Activity</p>
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2">{opened.detail}</div>
              </div>
              <div>
                <p className="text-black font-medium">Time</p>
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2">{fmtDate(opened.timestamp)}</div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-black font-medium">Catatan</p>
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 min-h-[44px]">
                  {opened.note ?? "-"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpenId(null)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Keluar
              </button>
              <button
                className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                onClick={() => setOpenId(null)}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
