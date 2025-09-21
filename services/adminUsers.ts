// services/adminUsers.ts
export type Role = "Admin" | "Expert User" | "Curator" | "Contributor";
export type User = {
  id: string | number;
  name: string;
  email: string;
  last_login: string | null;
  role: Role;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const baseHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "x-api-key": String(API_KEY),
} as const;

export async function listUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users`, {
    method: "GET",
    headers: baseHeaders,
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await safeDetail(res);
    throw new Error(`GET /admin-feature/users failed: ${res.status} ${msg}`);
  }
  return res.json();
}

export async function deleteUser(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users/${id}`, {
    method: "DELETE",
    headers: baseHeaders,
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await safeDetail(res);
    throw new Error(`DELETE /admin-feature/users/${id} failed: ${res.status} ${msg}`);
  }
}

export async function updateUserRole(
  id: string | number,
  role: Role
): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/admin-feature/users/${id}/role`, {
    method: "PUT",
    headers: baseHeaders,
    credentials: "include",
    body: JSON.stringify({ role_name: role }),
  });
  if (!res.ok) {
    const msg = await safeDetail(res);
    throw new Error(`PUT /admin-feature/users/${id}/role failed: ${res.status} ${msg}`);
  }
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
