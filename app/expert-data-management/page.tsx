"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied2";
import { useAuth } from "../auth/hooks/useAuth";

/** ---------- types & utils ---------- */
type AccessState = "loading" | "redirect" | "forbidden" | "granted";
const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");

type Row = {
  data_id: string;
  file_name: string;
  last_edited: string;
  submitted_by: string;
};

type PageProps = {
  initialRows?: Row[];
  initialError?: string | null;
  simulateLoadError?: boolean;
};

function getToken(): string | null {
  try {
    const raw = window.localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) return String(parsed.access_token);
      if (parsed?.token) return String(parsed.token);
    }
    const t = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
    return t || null;
  } catch {
    return null;
  }
}

function getTokenForDelete(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) return String(parsed.access_token);
      if (parsed?.token) return String(parsed.token);
    }
  } catch {}
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  try {
    const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  } catch {}
  return null;
}

function filterRows(rows: Row[], query: string): Row[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.data_id, r.file_name, r.last_edited, r.submitted_by].join(" ").toLowerCase().includes(q)
  );
}

/** ---------- page ---------- */
export default function ExpertDataManagementPage({
  initialRows,
  initialError,
  simulateLoadError,
}: PageProps = {}) {
  const router = useRouter();
  const { user } = useAuth();

  /** access gate */
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
    const role = normalizeRole(resolved.role);
    const allowed = role === "EXP_USER" || role === "ADMIN";
    setAccessState(allowed ? "granted" : "forbidden");
  }, [user]);

  useEffect(() => {
    if (accessState !== "redirect") return;
    const nextParam = encodeURIComponent("/expert-data-management");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);

  /** data + ui state */
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const [resultOpen, setResultOpen] = useState(false);
  const [resultOk, setResultOk] = useState<"success" | "error">("success");
  const [resultMsg, setResultMsg] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const authHeaders = () => {
    const token = getToken();
    const h: Record<string, string> = { "X-API-KEY": API_KEY };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  /** fetch list */
  useEffect(() => {
    if (accessState !== "granted") return;
    let cancelled = false;

    (async () => {
      try {
        if (simulateLoadError) throw new Error("simulate load error");
        if (typeof initialError !== "undefined" && initialError !== null) {
          if (!cancelled) {
            setError(initialError);
            setRows([]);
          }
          return;
        }
        if (Array.isArray(initialRows)) {
          if (!cancelled) {
            setRows(initialRows);
            setError(null);
          }
          return;
        }

        const res = await fetch(
          `${API_URL}/expert-feature/api/expert/datasets/?sort=last_edited:desc&page=1&pageSize=50`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setRows(Array.isArray(json.results) ? json.results : []);
          setError(null);
        }
      } catch (err) {
        console.error("fetch error:", err);
        if (!cancelled) setError("Failed to load data.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, API_KEY, accessState, initialRows, initialError, simulateLoadError]);

  /** actions */
  const goView = (row: Row) => {
    const url = new URL(window.location.origin + "/expert-data-management/view");
    url.searchParams.set("id", row.data_id);
    url.searchParams.set("fileName", row.file_name);
    url.searchParams.set("lastEdited", row.last_edited);
    url.searchParams.set("submittedBy", row.submitted_by);
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  const askDelete = (batchId: string) => {
    setConfirmTargetId(batchId);
    setConfirmOpen(true);
  };

  const reallyDelete = async () => {
    const batchId = confirmTargetId;
    if (!batchId) return;
    setConfirmOpen(false);
    setDeletingId(batchId);

    try {
      const res = await fetch(`${API_URL}/expert-feature/experts/batches/${batchId}/delete/`, {
        method: "DELETE",
        headers: {
          "X-API-KEY": API_KEY,
          Authorization: `Bearer ${getTokenForDelete()}`,
        },
      });

      if ([200, 202, 204].includes(res.status)) {
        setRows((prev) => prev.filter((r) => r.data_id !== batchId));
        setResultOk("success");
        setResultMsg("Data berhasil dihapus.");
        setResultOpen(true);
      } else {
        const text = await res.text().catch(() => "");
        console.error("delete failed:", res.status, text);
        setResultOk("error");
        setResultMsg(`Gagal menghapus data (status ${res.status}).`);
        setResultOpen(true);
      }
    } catch (e) {
      console.error(e);
      setResultOk("error");
      setResultMsg("Gagal menghapus data (jaringan / server).");
      setResultOpen(true);
    } finally {
      setDeletingId(null);
      setConfirmTargetId(null);
    }
  };

  const filteredRows = useMemo(() => filterRows(rows, query), [rows, query]);

  /** gates */
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

  /** render */
  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">

        {/* Filter Bar */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan ID Data, Nama Berkas, Terakhir Diedit, atau Pengunggah"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E8AF6]"
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

        {/* Table */}
        <div className="rounded-2xl border shadow-sm bg-white overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed border-collapse">
            <thead className="bg-[#4A78E0] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[12%]">ID Data</th>
                <th className="px-4 py-3 text-left font-semibold w-[28%]">Nama Berkas</th>
                <th className="px-4 py-3 text-left font-semibold w-[24%]">Terakhir Diedit</th>
                <th className="px-4 py-3 text-left font-semibold w-[20%]">Dikumpul oleh</th>
                <th className="px-4 py-3 text-center font-semibold w-[16%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : filteredRows.length ? (
                filteredRows.map((r) => {
                  const isDel = deletingId === r.data_id;
                  return (
                    <tr key={r.data_id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-3"
                        title={r.data_id} // tooltip shows full ID
                      >
                        {r.data_id ? `${r.data_id.slice(0, 10)}...` : "-"}
                      </td>
                      <td className="px-4 py-3">{r.file_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.last_edited
                          ? new Date(r.last_edited).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{r.submitted_by}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => askDelete(r.data_id)}
                            disabled={isDel}
                            className={`rounded-md border px-4 py-1 text-sm transition ${
                              isDel
                                ? "border-gray-300 text-gray-400 cursor-not-allowed"
                                : "border-red-500 text-red-500 hover:bg-red-50"
                            }`}
                            aria-busy={isDel}
                          >
                            {isDel ? "DELETING…" : "DELETE"}
                          </button>
                          <button
                            onClick={() => goView(r)}
                            className="rounded-md bg-[#2E66D4] text-white px-4 py-1 text-sm hover:brightness-95"
                          >
                            VIEW
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 text-sm">
                    {query ? "No matching data." : "No data."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ---------- MODALS ---------- */}

      {/* Confirm Delete */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Yakin hapus batch ini beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-2 border rounded-md"
              >
                Batal
              </button>
              <button
                onClick={reallyDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-md p-6 w-full max-w-md flex flex-col items-center">
            <div className="text-5xl mb-3 animate-pulse" aria-hidden>
              {resultOk === "success" ? "✅" : "❌"}
            </div>
            <div
              className={`text-sm text-center ${
                resultOk === "success" ? "text-green-700" : "text-red-600"
              }`}
            >
              {resultMsg}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setResultOpen(false)}
                className="px-3 py-2 bg-[#0069cf] text-white rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export {
  getToken as __test_getToken,
  getTokenForDelete as __test_getTokenForDelete,
  filterRows as __test_filterRows,
};