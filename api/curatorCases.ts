import { API_BASE } from "../config";

const API_BASE_URL = API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// backend routes are usually mounted under one of several prefixes depending on project urls.py.
// We try to auto-detect the correct prefix at runtime (only in browser) and cache it.
const STATIC_CASES_BASE = `${API_BASE_URL}/api/curator-feature/curator/cases`;

let detectedCasesBase: string | null = null;

async function probeCasesBase(): Promise<string> {
  if (detectedCasesBase) return detectedCasesBase;
  if (typeof window === 'undefined') {
    // server-side: default to the most likely path
    detectedCasesBase = STATIC_CASES_BASE;
    return detectedCasesBase;
  }

  const candidates = [
    `${API_BASE_URL}/api/curator-feature/curator/cases`,
    `${API_BASE_URL}/api/curator/curator/cases`,
    `${API_BASE_URL}/api/curator/cases`,
    `${API_BASE_URL}/curator-feature/curator/cases`,
    `${API_BASE_URL}/curator/cases`,
  ];

  // Try OPTIONS first (cheap, CORS-friendly). Give each request a small timeout.
  const controllerTimeout = (ms: number) => {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), ms);
    return { ac, id };
  };

  for (const c of candidates) {
    try {
      const { ac, id } = controllerTimeout(2000);
      const res = await fetch(c + '/', { method: 'OPTIONS', credentials: 'include', signal: ac.signal });
      clearTimeout(id);
      if (res && (res.status === 200 || res.status === 204 || res.status === 401 || res.status === 403)) {
        // OPTIONS succeeded or backend responded with auth/forbidden which still indicates path exists
        detectedCasesBase = c;
        return detectedCasesBase;
      }
    } catch (e) {
      // ignore and try next
    }
  }

  // fallback
  detectedCasesBase = STATIC_CASES_BASE;
  return detectedCasesBase;
}

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

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (process.env.NEXT_PUBLIC_API_KEY) h["x-api-key"] = String(process.env.NEXT_PUBLIC_API_KEY);
  return h;
}

class HttpError extends Error {
  constructor(public status: number, public detail?: any, message?: string) {
    super(message ?? `HTTP ${status}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: buildHeaders(),
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    let detail: any = undefined;
    try {
      detail = await res.json();
    } catch {
      try { detail = await res.text(); } catch { detail = undefined; }
    }
    throw new HttpError(res.status, detail, `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export type NewsPayload = {
  portal: string;
  title: string;
  type: string;
  content: string;
  url: string;
  author?: string;
  date_published?: string;
  img_url?: string;
};

export type CaseWritePayload = {
  disease: string;
  gender?: string;
  age?: number | null;
  city?: string | null;
  status: string; // 'biasa'|'minimal'|'bahaya'|'katastropik'
  severity: string; // 'insiden'|'hospitalisasi'|'mortalitas'
  location: { city: string; province?: string; latitude?: number; longitude?: number };
  news: NewsPayload;
};

async function resolveCasesBaseOrFallback() {
  // if already detected, return it; otherwise probe (browser-only) or fall back to static
  if (detectedCasesBase) return detectedCasesBase;
  try {
    return await probeCasesBase();
  } catch {
    return STATIC_CASES_BASE;
  }
}

export async function createCuratorCase(body: CaseWritePayload) {
  const base = await resolveCasesBaseOrFallback();
  return request(`${base}/`, { method: "POST", body: JSON.stringify(body) });
}

export async function getCuratorCase(id: string) {
  const base = await resolveCasesBaseOrFallback();
  return request(`${base}/${id}/`);
}

export async function updateCuratorCase(id: string, body: CaseWritePayload) {
  const base = await resolveCasesBaseOrFallback();
  return request(`${base}/${id}/`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteCuratorCase(id: string) {
  const base = await resolveCasesBaseOrFallback();
  return request(`${base}/${id}/`, { method: "DELETE" });
}

export { HttpError };
