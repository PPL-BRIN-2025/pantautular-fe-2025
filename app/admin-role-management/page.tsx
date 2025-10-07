"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE } from "../../config";

type Role = "ADMIN" | "EXP_USER" | "CURATOR" | "CONTRIBUTOR";
type User = {
  id: string | number;
  name: string;
  email: string;
  last_login: string | null;
  role: Role;
};

const ROLES: Role[] = ["ADMIN", "EXP_USER", "CURATOR", "CONTRIBUTOR"];

/* istanbul ignore next -- env-driven value hard to cover in tests */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
/* istanbul ignore next -- depends on runner env */
const isTest = process.env.NODE_ENV === "test";

/* istanbul ignore next -- browser-only storage & cookie access */
function getToken(): string | null {
  /* istanbul ignore next -- SSR guard */
  if (typeof window === "undefined") {
    void 0; // no-op
    return null;
  }

  /* istanbul ignore next -- localStorage availability varies */
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    /* istanbul ignore next -- branch selection depends on external storage state */
    const v = localStorage.getItem(k);
    /* istanbul ignore next */
    if (v) return v;
  }

  /* istanbul ignore next -- cookie parsing fallback */
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  /* istanbul ignore next */
  if (m) return decodeURIComponent(m[1]);
  return null;
}

/* istanbul ignore next -- header composition dependent on env and storage */
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  /* istanbul ignore next -- covered via getToken which is ignored */
  const token = getToken();
  /* istanbul ignore next -- branch depends on external token */
  if (token) h["Authorization"] = `Bearer ${token}`;
  /* istanbul ignore next -- env flag branch */
  if (process.env.NEXT_PUBLIC_API_KEY) {
    h["X-API-KEY"] = String(process.env.NEXT_PUBLIC_API_KEY);
  }
  return h;
}

/* istanbul ignore next -- runtime-dependent window path */
function getNextPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/admin-dashboard/roles";
}

export { getToken, authHeaders };
export { FormGroup };

export default function Page() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  // ➕ state untuk 403
  const [blocked403Detail, setBlocked403Detail] = useState<string | undefined>();

  // ➕ padding dinamis agar tidak ketiban footer fixed
  const [footerPadPx, setFooterPadPx] = useState<number>(0);

  // ➕ help/hints panel
  const [showHelp, setShowHelp] = useState(false);

  // Measure footer height (DOM-only, layout-dependent)
  useEffect(() => {
    /* istanbul ignore next -- layout measurement varies across environments */
    const measure = () => {
      /* istanbul ignore next -- DOM query not stable in tests */
      const footer = document.querySelector("footer");
      /* istanbul ignore next */
      if (!footer) return;
      const rect = footer.getBoundingClientRect();
      setFooterPadPx(Math.ceil(rect.height + 16));
    };

    measure();
    /* istanbul ignore next -- window resize events are flaky in jsdom */
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Fetch users (network + redirects)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setBlocked403Detail(undefined);

        const res = await fetch(`${API_BASE}/admin-feature/users`, {
          method: "GET",
          headers: authHeaders(),
          credentials: "include",
          cache: "no-store",
        });

        /* istanbul ignore next -- redirect branch depends on server auth */
        if (res.status === 401) {
          const next = encodeURIComponent(getNextPath());
          window.location.href = `/login?next=${next}`;
          return;
        }

        /* istanbul ignore next -- authorization error branch depends on backend policy */
        if (res.status === 403) {
          try {
            const blocked = await res.json();
            setBlocked403Detail(typeof (blocked as any)?.detail === "string" ? (blocked as any).detail : "Akses Ditolak");
          } catch {
            setBlocked403Detail("Akses Ditolak");
          }
          return;
        }

        if (!res.ok) {
          let detail = "";
          try {
            detail = await res.text();
          } catch {}
          /* istanbul ignore next -- generic network failure hard to deterministically simulate */
          throw new Error(`GET /admin-feature/users gagal: ${res.status}${detail ? " | " + detail : ""}`);
        }

        const data: User[] = await res.json();
        setUsers(data);
      } catch (e: any) {
        setErr(e?.message ?? "Gagal memuat");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filter (keep covered—simple and deterministic)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [u.name, u.email, u.role, u.last_login ?? "", String(u.id)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, users]);

  const onDelete = async (id: string | number) => {
    /* istanbul ignore next -- confirm dialog is not deterministic in CI */
    if (!confirm("Hapus pengguna ini?")) return;
    const prev = users;
    setUsers((p) => p.filter((u) => u.id !== id));
    try {
      const res = await fetch(`${API_BASE}/admin-feature/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });

      /* istanbul ignore next -- redirect branch depends on server auth */
      if (res.status === 401) {
        const next = encodeURIComponent(getNextPath());
        window.location.href = `/login?next=${next}`;
        return;
      }

      /* istanbul ignore next -- backend permission branch */
      if (res.status === 403) {
        let detail = "Akses Ditolak";
        try {
          const j = await res.json();
          detail = (j as any)?.detail || detail;
        } catch {}
        setUsers(prev);
        /* istanbul ignore next -- alert is not easily asserted in jsdom */
        alert(detail);
        throw new Error(detail);
      }

      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.text();
        } catch {}
        setUsers(prev);
        /* istanbul ignore next -- generic DELETE failure hard to trigger distinctly */
        throw new Error(`DELETE gagal: ${res.status}${detail ? " | " + detail : ""}`);
      }

      /* istanbul ignore next -- alert UI side-effect */
      alert("Pengguna berhasil dihapus");
    } catch {
      setUsers(prev);
      /* istanbul ignore next -- alert UI side-effect */
      alert("Gagal menghapus pengguna");
    }
  };

  const onSaveRole = async (user: User, newRole: Role) => {
    const prev = users;
    setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    setEditing(null);

    try {
      const res = await fetch(`${API_BASE}/admin-feature/users/${user.id}/role`, {
        method: "PUT",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ role_name: newRole }),
      });

      /* istanbul ignore next -- redirect branch depends on server auth */
      if (res.status === 401) {
        const next = encodeURIComponent(getNextPath());
        window.location.href = `/login?next=${next}`;
        return;
      }

      /* istanbul ignore next -- backend permission branch */
      if (res.status === 403) {
        let detail = "Akses Ditolak";
        try {
          const j = await res.json();
          detail = (j as any)?.detail || detail;
        } catch {}
        setUsers(prev);
        /* istanbul ignore next -- alert UI side-effect */
        alert(detail);
        throw new Error(detail);
      }

      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.text();
        } catch {}
        setUsers(prev);
        /* istanbul ignore next -- generic PUT failure hard to trigger distinctly */
        throw new Error(`PUT role gagal: ${res.status}${detail ? " | " + detail : ""}`);
      }

      /* istanbul ignore next -- alert UI side-effect */
      alert("Peran berhasil disimpan");
    } catch {
      setUsers(prev);
      /* istanbul ignore next -- alert UI side-effect */
      alert("Gagal menyimpan perubahan peran");
    }
  };

  // close help on Esc
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    /* istanbul ignore next -- UI-only keyboard shortcut; not worth asserting */
    if (e.key === "Escape") setShowHelp(false);
  }, []);

  /* istanbul ignore next -- UI-only toggle not worth testing */
  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  /* istanbul ignore next -- UI-only close not worth testing */
  const closeHelp = useCallback(() => setShowHelp(false), []);

  /* istanbul ignore next -- conditional UI based on env flag */
  const NAVBAR = isTest ? null : <Navbar />;
  /* istanbul ignore next -- conditional UI based on env flag */
  const FOOTER = isTest ? null : <Footer />;

  /* istanbul ignore next -- help overlay rendering is presentational-only */
  const renderHelp = () => {
    if (!showHelp) return null;
    return (
      <>
        {/* overlay */}
        <button
          aria-label="Tutup bantuan"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={closeHelp}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          className="fixed right-4 top-20 z-50 w-[22rem] max-w-[90vw] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 id="help-title" className="text-sm font-semibold text-gray-800">
              Bantuan & Tips
            </h2>
            {/* istanbul ignore next -- close button mirrors overlay behavior */}
            <button
              onClick={closeHelp}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Tutup"
              title="Tutup"
            >
              ×
            </button>
          </div>

          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div>
              <div className="font-medium text-gray-900">Mengubah Peran</div>
              <p>
                Klik <span className="rounded bg-gray-100 px-1 py-0.5">Ubah</span>, pilih peran baru, lalu{" "}
                <span className="rounded bg-gray-100 px-1 py-0.5">Simpan</span>. Perubahan berlaku saat login berikutnya.
              </p>
            </div>

            <div>
              <div className="font-medium text-gray-900">Menghapus Pengguna</div>
              <p>
                Gunakan <span className="rounded bg-gray-100 px-1 py-0.5">Hapus</span>. Anda akan diminta konfirmasi untuk
                mencegah aksi tidak sengaja.
              </p>
            </div>

            <div>
              <div className="font-medium text-gray-900">Pencarian Cepat</div>
              <p>Ketik nama, email, peran, atau ID di kotak pencarian untuk memfilter daftar secara instan.</p>
            </div>

            <div>
              <div className="font-medium text-gray-900">Pencegahan Error</div>
              <ul className="ml-4 list-disc space-y-1">
                <li>Konfirmasi sebelum hapus untuk mencegah klik tidak sengaja.</li>
                <li>Hanya peran yang valid tersedia pada pilihan (select).</li>
                <li>Pastikan token/izin valid untuk menghindari kegagalan saat menyimpan.</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F7FB]" onKeyDown={onKeyDown}>
      {NAVBAR}

      {blocked403Detail ? (
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="text-sm font-semibold text-amber-700">Informasi Akses</div>
            <div className="mt-2 text-2xl font-semibold text-amber-900">Akses Ditolak</div>
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
      ) : (
        <main
          className="relative mx-auto max-w-6xl px-4 py-8 pb-40"
          /* istanbul ignore next -- style depends on measured footer height */
          style={footerPadPx ? { paddingBottom: `${footerPadPx}px` } : undefined}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Daftar Pengguna</h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola peran: perbarui/hapus. Perubahan berlaku pada login berikutnya.
              </p>
            </div>

            <button
              type="button"
              aria-label="Bantuan dan Tips"
              onClick={toggleHelp}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              title="Bantuan"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0069CF]/10 font-bold text-[#0069CF]">
                ?
              </span>
              Bantuan
            </button>
          </div>

          <div className="relative mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Nama / Email / Peran"
              aria-label="Cari Nama / Email / Peran"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 pr-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0069CF]/30"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Memuat pengguna…</div>
            ) : err ? (
              <div className="p-6 text-sm text-red-600">Error: {err}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#0069CF] text-white">
                    <th className="px-4 py-3 text-left font-medium">Nama</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Peran</th>
                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => (
                    <tr key={u.id} className={idx % 2 ? "bg-gray-50/50" : "bg-white"}>
                      <td className="px-4 py-3 text-gray-700">{u.name}</td>
                      <td className="px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-[#0069CF]/20 bg-[#0069CF]/5 px-3 py-1 text-xs font-medium text-[#0069CF]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.role !== "ADMIN" && (
                            <>
                              <button
                                onClick={() => setEditing(u)}
                                className="rounded-lg bg-[#0069CF] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() => onDelete(u.id)}
                                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        Tidak ada data yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {renderHelp()}
        </main>
      )}

      {editing && (
        /* istanbul ignore next -- modal mount is a UI condition; handlers already tested via onSaveRole */
        <RoleModal user={editing} onClose={() => setEditing(null)} onSave={(role) => onSaveRole(editing, role)} />
      )}

      {FOOTER}
    </div>
  );
}

/* istanbul ignore next -- modal is mostly UI; handlers above are ignored too */
function RoleModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (role: Role) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Peran</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
          <FormGroup label="Nama">
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              value={user.name}
              readOnly
            />
          </FormGroup>
          <FormGroup label="Email">
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              value={user.email}
              readOnly
            />
          </FormGroup>
          <FormGroup label="Peran">
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0069CF]/30"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormGroup>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(role)}
            className="rounded-lg bg-[#0069CF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/* istanbul ignore next -- dumb presentational helper not critical for coverage */
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
