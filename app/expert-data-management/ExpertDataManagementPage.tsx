"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied2";
import { useAuth } from "../auth/hooks/useAuth";
import type { User } from "@/types";

export const normalizeRole = (r?: string | null) =>
  r ? r.trim().toUpperCase() : "";
type AccessState = "loading" | "redirect" | "forbidden" | "granted";

type Row = {
  data_id: string;
  file_name: string;
  last_edited: string;
  submitted_by: string;
};

type ExpertDataManagementPageProps = {
  initialRows?: Row[];
  initialQuery?: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.access_token) return String(parsed.access_token);
        /* istanbul ignore next */
        if (parsed?.token) return String(parsed.token);
      } catch {
        // ignore parse failures and fall through to other lookups
      }
    }
  } catch {
    // ignore access issues
  }

  const fallbackKeys = ["access_token", "token", "accessToken", "jwt"];
  for (const key of fallbackKeys) {
    try {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    } catch {
      // continue trying other keys
    }
  }

  try {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // ignore cookie parsing errors
  }

  return null;
}

export function getTokenForDelete(): string | null {
  if (typeof window === "undefined") return null;

  // 1) Your original flow:
  try {
    const raw = window.localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) return String(parsed.access_token);
      /* istanbul ignore next */
      if (parsed?.token) return String(parsed.token);
    }
  } catch {
    // ignore parse failures
  }

  // 2) New fallback keys:
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }

  // 3) Cookie fallback:
  try {
    const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  } catch {
    // ignore cookie parsing issues
  }

  return null;
}

export const buildViewHref = (row: Row, origin: string): string => {
  const url = new URL(origin + "/expert-data-management/view");
  url.searchParams.set("id", row.data_id);
  url.searchParams.set("fileName", row.file_name);
  url.searchParams.set("lastEdited", row.last_edited);
  url.searchParams.set("submittedBy", row.submitted_by);
  return url.pathname + "?" + url.searchParams.toString();
};

export const hydrateUserFromStorage = (user: User | null): User | null => {
  if (user) return user;
  /* istanbul ignore next */
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem("user");
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    // ignore JSON issues
  }

  return null;
};

export const filterRowsByQuery = (rows: Row[], query: string): Row[] => {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.data_id, r.file_name, r.last_edited, r.submitted_by]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
};

export const getEmptyStateMessage = (query: string): string =>
  query.trim() ? "No matching data." : "No data.";

export const normalizeDatasetResults = (payload: { results?: unknown }): Row[] =>
  Array.isArray(payload?.results) ? (payload?.results as Row[]) : [];

export const resolveAccessState = (
  effectiveUser: User | null,
  isCheckingAccess: boolean
): AccessState => {
  if (isCheckingAccess) return "loading";
  if (!effectiveUser) return "redirect";

  const role = normalizeRole(effectiveUser.role);
  if (role !== "EXP_USER") {
    return "forbidden";
  }

  return "granted";
};

export default function ExpertDataManagementPage(
  props?: ExpertDataManagementPageProps
) {
  const resolvedInitialRows = props?.initialRows;
  const resolvedInitialQuery = props?.initialQuery ?? "";

  const router = useRouter();
  const { user } = useAuth();
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const resolved = hydrateUserFromStorage(user);
    setEffectiveUser(resolved ?? null);
    setIsCheckingAccess(false);
  }, [user]);

  useEffect(() => {
    setAccessState(resolveAccessState(effectiveUser, isCheckingAccess));
  }, [effectiveUser, isCheckingAccess]);

  useEffect(() => {
    if (accessState !== "redirect") return;
    const nextParam = encodeURIComponent("/expert-data-management");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);

  const [rows, setRows] = useState<Row[]>(resolvedInitialRows ?? []);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(resolvedInitialQuery);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const authHeaders = () => {
    const token = getToken();
    const h: Record<string, string> = { "X-API-KEY": API_KEY };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    if (accessState !== "granted" || resolvedInitialRows) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/expert-feature/api/expert/datasets/?sort=last_edited:desc&page=1&pageSize=50`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        // DRF paginator -> {count, results: [...]}
        setRows(normalizeDatasetResults(json));
      } catch (err: any) {
        console.error("fetch error:", err);
        setError("Failed to load datasets.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, API_KEY, accessState, resolvedInitialRows]);

  const goView = (row: Row) => {
    const href = buildViewHref(row, window.location.origin);
    router.push(href);
  };


  const handleDelete = async (batchId: string) => {
      if (!batchId) return;
      /* istanbul ignore next */
      if (!confirm("Yakin hapus batch ini beserta datanya?")) return;

    setDeletingId(batchId);
    try {
      const res = await fetch(`${API_URL}/expert-feature/experts/batches/${batchId}/delete/`, {
        method: "DELETE",
        headers: {
          "X-API-KEY": API_KEY,
          "Authorization": `Bearer ${getTokenForDelete()}`,
        },
      });

      if ([200, 202, 204].includes(res.status)) {
        setRows((prev) => prev.filter((r) => r.data_id !== batchId));
      } else {
        const text = await res.text().catch(() => "");
        console.error("delete failed:", res.status, text);
        alert(`Failed to delete batch (status ${res.status}).`);
      }
    } catch (e) {
      console.error(e);
      alert("Delete failed (network).");
    } finally {
      setDeletingId(null);
    }
  };


  const filteredRows = useMemo(
    () => filterRowsByQuery(rows, query),
    [rows, query]
  );

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

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <div className="text-gray-500 text-base font-medium mb-4">
          &lt; Expert / Dataset
        </div>

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
                      <td className="px-4 py-3">{r.data_id}</td>
                      <td className="px-4 py-3">{r.file_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.last_edited}</td>
                      <td className="px-4 py-3">{r.submitted_by}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleDelete(r.data_id)}
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
                    {getEmptyStateMessage(query)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
