"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type Role = "Admin" | "Expert User" | "Curator" | "Contributor";
type User = {
  id: string | number;
  name: string;
  email: string;
  last_login: string | null;
  role: Role;
};

const ROLES: Role[] = ["Admin", "Expert User", "Curator", "Contributor"];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** =======================
 *  TOGGLE: API vs DUMMY
 *  ======================= */
const USE_API = false;

/** =======================
 *  DUMMY DATA (bervariasi)
 *  ======================= */
const DUMMY_USERS: User[] = [
  { id: 1, name: "alika",  email: "alika@pantautular.id",  last_login: "2025-08-30 08:12:10", role: "Admin" },
  { id: 2, name: "bima",   email: "bima@pantautular.id",   last_login: "2025-08-29 21:05:44", role: "Curator" },
  { id: 3, name: "citra",  email: "citra@gmail.com",       last_login: "2025-08-28 14:32:12", role: "Contributor" },
  { id: 4, name: "dimas",  email: "dimas@yahoo.com",       last_login: "2025-08-27 09:01:05", role: "Expert User" },
  { id: 5, name: "eka",    email: "eka@pantautular.id",    last_login: "2025-08-26 19:45:30", role: "Curator" },
  { id: 6, name: "farah",  email: "farah@mail.com",        last_login: "2025-08-25 07:12:55", role: "Contributor" },
  { id: 7, name: "gilang", email: "gilang@pantautular.id", last_login: "2025-08-24 22:20:11", role: "Expert User" },
  { id: 8, name: "hana",   email: "hana@mail.com",         last_login: "2025-08-23 10:00:00", role: "Admin" },
  { id: 9, name: "indra",  email: "indra@pantautular.id",  last_login: "2025-08-22 15:40:03", role: "Contributor" },
  { id: 10, name: "joko",  email: "joko@mail.com",         last_login: null,                  role: "Curator" },
];

export default function Page() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  // load data
  useEffect(() => {
    if (!USE_API) {
      setUsers(DUMMY_USERS);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/authentication/admin/users`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`GET /admin/users failed: ${res.status}`);
        const data: User[] = await res.json();
        setUsers(data);
      } catch (e: any) {
        setErr(e.message ?? "Load gagal");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filter (fixed): name, email, role, last_login
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [
        u.name,
        u.email,
        u.role,
        u.last_login ?? "",
        String(u.id),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, users]);

  const onDelete = async (id: string | number) => {
    if (!confirm("Hapus pengguna ini?")) return;
    const prev = users;
    setUsers((p) => p.filter((u) => u.id !== id)); // optimistic
    if (!USE_API) return;

    try {
      const res = await fetch(`${API_BASE}/authentication/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
    } catch {
      setUsers(prev);
      alert("Gagal menghapus user");
    }
  };

  const onSaveRole = async (user: User, newRole: Role) => {
    const prev = users;
    setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))); // optimistic
    setEditing(null);
    if (!USE_API) return;

    try {
      const res = await fetch(`${API_BASE}/authentication/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    } catch {
      setUsers(prev);
      alert("Gagal menyimpan perubahan role");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7FB]">

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-800">Daftar Pengguna</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola role: tambah/ubah/hapus. Perubahan berlaku login berikutnya.
        </p>

        {/* search */}
        <div className="relative mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Nama / Email / Role"
            aria-label="Cari Nama / Email / Role"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 pr-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0069CF]/30"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6.75 6.75 0 1 0 4.243 11.877l3.315 3.315a.75.75 0 1 0 1.06-1.06l-3.315-3.315A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading users…</div>
          ) : err ? (
            <div className="p-6 text-sm text-red-600">Error: {err}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#0069CF] text-white">
                  <th className="px-4 py-3 text-left font-medium">Username</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id} className={idx % 2 ? "bg-gray-50/50" : "bg-white"}>
                    <td className="px-4 py-3 text-gray-700">{u.name}</td>
                    <td className="px-4 py-3 text-gray-700">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.last_login ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-[#0069CF]/20 bg-[#0069CF]/5 px-3 py-1 text-xs font-medium text-[#0069CF]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
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
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      Tidak ada data yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {editing && (
        <RoleModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(newRole) => onSaveRole(editing, newRole)}
        />
      )}
    </div>
  );
}

/** ================
 *  POPUP (Modal)
 *  ================ */
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
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [note, setNote] = useState<string>("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Role</h2>
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
          <FormGroup label="Role">
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
          <FormGroup label="Berlaku Mulai">
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Kadaluwarsa (opsional)">
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Catatan (opsional)">
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="—"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
