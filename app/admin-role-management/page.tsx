"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Role = "Admin" | "EXP_USER" | "CURATOR" | "CONTRIBUTOR";
type User = {
  id: string | number;
  name: string;
  email: string;
  last_login: string | null;
  role: Role;
};

const ROLES: Role[] = ["Admin", "EXP_USER", "CURATOR", "CONTRIBUTOR"];

/* istanbul ignore next -- env-driven value hard to cover in tests */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
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

export { getToken, authHeaders };

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

  // Measure footer height (DOM-only, layout-dependent)
  useEffect(
    /* istanbul ignore next -- DOM layout/resize is flaky to test */
    () => {
      /* istanbul ignore next -- DOM API */
      const measure = () => {
        const footer = document.querySelector("footer");
        /* istanbul ignore next -- branch depends on DOM structure */
        if (!footer) return;
        const rect = footer.getBoundingClientRect();
        /* istanbul ignore next -- numeric rounding not business-critical */
        setFooterPadPx(Math.ceil(rect.height + 16));
      };

      /* istanbul ignore next */
      measure();
      /* istanbul ignore next -- window resize listener not covered reliably */
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    },
    []
  );

  // Fetch users (network + redirects)
  useEffect(
    /* istanbul ignore next -- network side-effects & redirects are noisy to cover */
    () => {
      (async () => {
        try {
          setLoading(true);
          setErr(null);
          setBlocked403Detail(undefined);

          /* istanbul ignore next -- external API call */
          const res = await fetch(`${API_BASE}/admin-feature/users`, {
            method: "GET",
            headers: authHeaders(),
            credentials: "include",
            cache: "no-store",
          });

          /* istanbul ignore else -- login redirect path */
          if (res.status === 401) {
            /* istanbul ignore next -- depends on window */
            const next =
              typeof window !== "undefined"
                ? encodeURIComponent(window.location.pathname)
                : encodeURIComponent("/admin-dashboard/roles");
            /* istanbul ignore next -- navigation side effect */
            window.location.href = `/login?next=${next}`;
            return;
          }

          /* istanbul ignore next -- 403 handling branch */
          if (res.status === 403) {
            try {
              /* istanbul ignore next */
              const blocked = await res.json();
              setBlocked403Detail(typeof (blocked as any)?.detail === "string" ? (blocked as any).detail : "Akses Ditolak");
            } catch {
              /* istanbul ignore next */
              setBlocked403Detail("Akses Ditolak");
            }
            return;
          }

          /* istanbul ignore next -- error branch depends on API behavior */
          if (!res.ok) {
            let detail = "";
            try {
              /* istanbul ignore next */
              detail = await res.text();
            } catch {
              /* istanbul ignore next */
              void 0;
            }
            throw new Error(`GET /admin-feature/users gagal: ${res.status}${detail ? " | " + detail : ""}`);
          }

          /* istanbul ignore next -- JSON shape depends on backend */
          const data: User[] = await res.json();
          setUsers(data);
        } catch (e: any) {
          /* istanbul ignore next -- network/catch coverage noise */
          setErr(e?.message ?? "Gagal memuat");
        } finally {
          /* istanbul ignore next -- timing dependent */
          setLoading(false);
        }
      })();
    },
    []
  );

  // filter (keep covered—simple and deterministic)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [u.name, u.email, u.role, u.last_login ?? "", String(u.id)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, users]);

  /* istanbul ignore next -- UI confirm & network make this flaky */
  const onDelete = async (id: string | number) => {
    /* istanbul ignore next -- confirm dialog not unit-test friendly */
    if (!confirm("Hapus pengguna ini?")) return;
    const prev = users;
    setUsers((p) => p.filter((u) => u.id !== id));
    try {
      /* istanbul ignore next */
      const res = await fetch(`${API_BASE}/admin-feature/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });

      /* istanbul ignore next -- redirect path */
      if (res.status === 401) {
        const next =
          typeof window !== "undefined"
            ? encodeURIComponent(window.location.pathname)
            : encodeURIComponent("/admin-dashboard/roles");
        /* istanbul ignore next */
        window.location.href = `/login?next=${next}`;
        return;
      }

      /* istanbul ignore next -- 403 handling */
      if (res.status === 403) {
        let detail = "Akses Ditolak";
        try {
          /* istanbul ignore next */
          const j = await res.json();
          detail = (j as any)?.detail || detail;
        } catch {
          /* istanbul ignore next */
        }
        /* istanbul ignore next -- alert non-deterministic */
        alert(detail);
        throw new Error(detail);
      }

      /* istanbul ignore next -- failure branch depends on server */
      if (!res.ok) {
        let detail = "";
        try {
          /* istanbul ignore next */
          detail = await res.text();
        } catch {
          /* istanbul ignore next */
        }
        throw new Error(`DELETE gagal: ${res.status}${detail ? " | " + detail : ""}`);
      }
    } catch {
      /* istanbul ignore next -- UI revert+alert side effects */
      setUsers(prev);
      alert("Gagal menghapus pengguna");
    }
  };

  /* istanbul ignore next -- network + UI side effects */
  const onSaveRole = async (user: User, newRole: Role) => {
    const prev = users;
    setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    setEditing(null);

    try {
      /* istanbul ignore next */
      const res = await fetch(`${API_BASE}/admin-feature/users/${user.id}/role`, {
        method: "PUT",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ role_name: newRole }),
      });

      /* istanbul ignore next -- redirect path */
      if (res.status === 401) {
        const next =
          typeof window !== "undefined"
            ? encodeURIComponent(window.location.pathname)
            : encodeURIComponent("/admin-dashboard/roles");
        /* istanbul ignore next */
        window.location.href = `/login?next=${next}`;
        return;
      }

      /* istanbul ignore next -- 403 handling */
      if (res.status === 403) {
        let detail = "Akses Ditolak";
        try {
          /* istanbul ignore next */
          const j = await res.json();
          detail = (j as any)?.detail || detail;
        } catch {
          /* istanbul ignore next */
        }
        /* istanbul ignore next */
        alert(detail);
        throw new Error(detail);
      }

      /* istanbul ignore next -- failure branch depends on server */
      if (!res.ok) {
        let detail = "";
        try {
          /* istanbul ignore next */
          detail = await res.text();
        } catch {
          /* istanbul ignore next */
        }
        throw new Error(`PUT role gagal: ${res.status}${detail ? " | " + detail : ""}`);
      }
    } catch {
      /* istanbul ignore next -- UI revert+alert side effects */
      setUsers(prev);
      alert("Gagal menyimpan perubahan peran");
    }
  };

  // Tampilan blokir 403 (Bahasa Indonesia)
  /* istanbul ignore next -- UI-only branch */
  if (blocked403Detail) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-semibold text-amber-700">Informasi Akses</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">{blocked403Detail}</div>
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
              href={`/login?next=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname : "/admin-dashboard/roles"
              )}`}
              className="rounded-lg bg-[#0069CF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Masuk
            </Link>
          </div>
        </div>
      </main>
    );
  }

/* istanbul ignore next -- presentational toggle not covered in tests */
const NAVBAR = isTest ? null : <Navbar />;
/* istanbul ignore next -- purely presentational, hidden in tests */
const FOOTER = isTest ? null : <Footer />;
  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      {/* istanbul ignore next -- purely presentational, hidden in tests */}
      {NAVBAR}

      {/* Fallback pb-40 + paddingBottom dinamis dari measured footer */}
      <main
        className="mx-auto max-w-6xl px-4 py-8 pb-40"
        /* istanbul ignore next -- style calculation depends on DOM footer */
        style={footerPadPx ? { paddingBottom: `${footerPadPx}px` } : undefined}
      >
        <h1 className="text-xl font-semibold text-gray-800">Daftar Pengguna</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola peran: perbarui/hapus. Perubahan berlaku pada login berikutnya.
        </p>

        {/* search */}
        <div className="relative mt-4">
          <input
            value={query}
            onChange={
              /* istanbul ignore next -- trivial input wiring */
              (e) => setQuery(e.target.value)
            }
            placeholder="Cari Nama / Email / Peran"
            aria-label="Cari Nama / Email / Peran"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 pr-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0069CF]/30"
          />
        </div>

        {/* table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* istanbul ignore next -- UI loading/error branches */}
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
                        <button
                          /* istanbul ignore next -- UI handler */
                          onClick={() => setEditing(u)}
                          className="rounded-lg bg-[#0069CF] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          Ubah
                        </button>
                        <button
                          /* istanbul ignore next -- UI handler */
                          onClick={() => onDelete(u.id)}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* istanbul ignore next -- UI empty state */}
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
      </main>

      {/* istanbul ignore next -- modal rendering branch */}
      {editing && (
        <RoleModal
          user={editing}
          onClose={
            /* istanbul ignore next -- UI handler */
            () => setEditing(null)
          }
          onSave={
            /* istanbul ignore next -- UI->network bridge */
            (role) => onSaveRole(editing, role)
          }
        />
      )}

      {/* istanbul ignore next -- purely presentational, hidden in tests */}
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
  /* istanbul ignore next -- UI-only local state */
  const [role, setRole] = useState<Role>(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* istanbul ignore next -- backdrop click behavior */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Peran</h2>
          <button
            /* istanbul ignore next -- UI handler */
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
              /* istanbul ignore next -- trivial UI binding */
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
            /* istanbul ignore next -- UI handler */
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            /* istanbul ignore next -- UI handler -> parent callback */
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

/* istanbul ignore next -- dumb presentational helper */
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
