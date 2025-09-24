// services/adminUsers.ts
export type Role = "Admin" | "Expert User" | "Curator" | "Contributor";
export type User = {
  id: string | number;
  name: string;
  email: string;
  last_login: string | null;
  role: Role;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Reuse Feature-1-style auth */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  return null;
}
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function listUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET /admin-feature/users failed: ${res.status} ${await safeDetail(res)}`);
  return res.json();
}

export async function deleteUser(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /admin-feature/users/${id} failed: ${res.status} ${await safeDetail(res)}`);
}

export async function updateUserRole(id: string | number, role: Role): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users/${id}/role`, {
    method: "PUT",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ role_name: role }),
  });
  if (!res.ok)
    throw new Error(`PUT /admin-feature/users/${id}/role failed: ${res.status} ${await safeDetail(res)}`);
  return res.json();
}

async function safeDetail(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.detail ? String(j.detail) : "";
  } catch {
    return "";
  }
}
