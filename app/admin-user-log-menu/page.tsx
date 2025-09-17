"use client";
import { useEffect, useMemo, useState } from "react";

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

// dummy fetch
async function fetchUserLogs(params: Query): Promise<Resp> {
  await new Promise((r) => setTimeout(r, 150));
  const seed: UserLog[] = Array.from({ length: 25 }).map((_, i) => ({
    id: String(i + 1),
    username: `user${(i % 3) + 1}`,
    email: `user${(i % 3) + 1}@gmail.com`,
    timestamp: new Date(Date.now() - i * 36e5).toISOString(),
    detail: i % 3 === 0 ? "Login success" : i % 3 === 1 ? "Change Role" : "Login Failed",
    note: i % 2 === 0 ? "Lokasi: Jakarta (GeoIP). 2FA: aktif." : "Lokasi: Bandung (GeoIP). 2FA: non-aktif.",
  }));
  const pageSize = params.pageSize ?? 10;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return { data: seed.slice(start, start + pageSize), page, pageSize, total: seed.length };
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

  // detail-modal state
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

  // allow closing modal with Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-100 p-6 font-sans">
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-blue-500 text-white ring-1 ring-black rounded-t-[10px]">
          <div className="grid grid-cols-[180px_minmax(0,1fr)_210px_160px_64px] gap-0">
            {[
              "Username",
              "Email",
              "Date",
              "Detail",
              <span key="act" className="w-full text-right">Action</span>,
            ].map((label, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 text-lg leading-loose font-normal ${
                  idx === 0 ? "" : "border-l border-white/80"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="bg-white">
          {rows.length > 0 ? (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="px-4 py-6 hover:bg-gray-50">
                  <div className="grid grid-cols-[180px_minmax(0,1fr)_210px_160px_64px] items-center gap-0">
                    <div className="px-0 text-black text-lg leading-loose font-normal">{r.username}</div>
                    <div className="px-0 text-black text-lg leading-loose font-normal truncate">{r.email}</div>
                    <div className="px-0 text-black text-lg leading-loose font-normal tabular-nums">
                      {fmtDate(r.timestamp)}
                    </div>
                    <div className="px-0 text-lg leading-loose">
                      <StatusBadge detail={r.detail} />
                    </div>
                    <div className="px-0 text-right">
                      <button
                        className="text-black text-2xl leading-loose px-2 py-1 hover:bg-gray-100 rounded-lg"
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
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white p-4">
          <p className="text-xs text-gray-600">
            Menampilkan <span className="font-medium">{rows.length}</span> dari{" "}
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

      <p className="mt-4 text-xs text-gray-500">Klik baris untuk melihat detail log.</p>

      {/* ------------------ Detail Modal ------------------ */}
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
            {/* Header */}
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

            {/* Fields */}
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

            {/* Actions */}
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
      {/* ---------------- End Detail Modal ---------------- */}

    </div>
  );
}
