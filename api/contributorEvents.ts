import { API_BASE } from "../config";

const API_BASE_URL = API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STATIC_BASE = `${API_BASE_URL}/api/contributor-feature/contributor/cases`;

let detectedBase: string | null = null;

function getRuntimeOverride(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (window as any).__CONTRIB_CASES_BASE;
  } catch {
    return undefined;
  }
}

if (typeof window !== "undefined") {
  try {
    (window as any).__RESET_CONTRIB_CASES_BASE = () => {
      detectedBase = null;
      try {
        console.debug("[contributorEvents] runtime reset detectedBase");
      } catch (e) {}
    };
  } catch (e) {}
}

async function probeContributorBase(): Promise<string> {
  if (detectedBase) return detectedBase;
  if (typeof window === "undefined") {
    detectedBase = STATIC_BASE;
    return detectedBase;
  }

  const candidates = [
    `${API_BASE_URL}/api/contributor-feature/contributor/cases`,
    `${API_BASE_URL}/contributor-feature/contributor/cases`,
    `${API_BASE_URL}/api/contributor-feature/cases`,
    `${API_BASE_URL}/contributor-feature/cases`,
    `${API_BASE_URL}/api/contributor/cases`,
    `${API_BASE_URL}/contributor/cases`,
  ];

  const controllerTimeout = (ms: number) => {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), ms);
    return { ac, id };
  };

  for (const base of candidates) {
    try {
      const { ac, id } = controllerTimeout(2000);
      const res = await fetch(base + "/", { method: "OPTIONS", credentials: "include", signal: ac.signal });
      clearTimeout(id);
      try {
        console.debug(`[contributorEvents] probe ${base} -> OPTIONS ${res.status}`);
      } catch (e) {}
      if (res && (res.status === 200 || res.status === 204 || res.status === 401 || res.status === 403)) {
        try {
          const { ac: ac2, id: id2 } = controllerTimeout(2000);
          const g = await fetch(base + "/", { method: "GET", credentials: "include", signal: ac2.signal });
          clearTimeout(id2);
          try {
            console.debug(`[contributorEvents] probe ${base} -> GET ${g.status}`);
          } catch (e) {}
          if (g && (g.status === 200 || g.status === 204 || g.status === 401 || g.status === 403)) {
            detectedBase = base;
            try {
              console.debug(`[contributorEvents] selected base -> ${detectedBase}`);
            } catch (e) {}
            return detectedBase;
          }
        } catch (e) {
          // ignore and continue
        }
      }
    } catch (e) {
      try {
        console.debug(`[contributorEvents] probe ${base} -> error ${String(e)}`);
      } catch (err) {}
      continue;
    }
  }

  detectedBase = STATIC_BASE;
  return detectedBase;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const m = document.cookie.match(/(?:^|;\\s*)access_token=([^;]+)/);
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

export class HttpError extends Error {
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
      try {
        detail = await res.text();
      } catch {
        detail = undefined;
      }
    }
    throw new HttpError(res.status, detail, `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

async function resolveBase(): Promise<string> {
  const override = getRuntimeOverride();
  if (override) {
    detectedBase = override;
    return detectedBase;
  }
  if (detectedBase) return detectedBase;
  try {
    return await probeContributorBase();
  } catch {
    detectedBase = STATIC_BASE;
    return detectedBase;
  }
}

export type ContributorNewsPayload = {
  portal: string;
  title: string;
  type: string;
  content: string;
  url: string;
  author?: string;
  date_published?: string | null;
  img_url?: string | null;
};

export type ContributorCasePayload = {
  disease: string;
  gender?: string;
  age?: number | null;
  city?: string | null;
  status: string;
  severity: string;
  location: { city: string; province?: string; latitude?: number | null; longitude?: number | null };
  news: ContributorNewsPayload;
};

export type ContributorCaseRead = {
  id: string;
  gender?: string;
  age?: number;
  city?: string;
  status?: string;
  severity?: string;
  disease_name?: string;
  location?: { city?: string; province?: string; latitude?: number; longitude?: number };
  news?: ContributorNewsPayload | null;
  state?: string;
  review_note?: string;
  reviewed_at?: string;
  reviewed_by?: { id?: string; name?: string; email?: string; role?: string } | null;
  created_by?: { id?: string; name?: string; email?: string; role?: string } | null;
  created_at?: string;
  updated_at?: string;
  approved_case?: string | null;
};

export async function createContributorEvent(body: ContributorCasePayload) {
  const base = await resolveBase();
  try {
    console.debug(`[contributorEvents] POST -> ${base}/`, body);
  } catch (e) {}
  return request(`${base}/`, { method: "POST", body: JSON.stringify(body) });
}

export async function listContributorEvents(pageUrl?: string) {
  const base = pageUrl ? pageUrl : `${await resolveBase()}/`;
  try {
    console.debug(`[contributorEvents] LIST -> ${base}`);
  } catch (e) {}
  return request<any>(base);
}

export async function listPendingContributorEvents() {
  const base = await resolveBase();
  const url = `${base}/?state=pending`;
  try {
    console.debug(`[contributorEvents] LIST (pending) -> ${url}`);
  } catch (e) {}
  const data = await request<any>(url);
  if (Array.isArray(data)) return data as ContributorCaseRead[];
  if (data && Array.isArray((data as any).results)) return (data as any).results as ContributorCaseRead[];
  return [];
}

export async function reviewContributorEvent(id: string, action: "approve" | "reject", note?: string) {
  const base = await resolveBase();
  const url = `${base}/${id}/review/`;
  try {
    console.debug(`[contributorEvents] REVIEW -> ${url} (${action})`);
  } catch (e) {}
  return request(url, { method: "POST", body: JSON.stringify({ action, note }) });
}

export async function getContributorEvent(id: string) {
  const base = await resolveBase();
  try {
    console.debug(`[contributorEvents] GET -> ${base}/${id}/`);
  } catch (e) {}
  return request(`${base}/${id}/`);
}

export async function updateContributorEvent(id: string, body: ContributorCasePayload) {
  const base = await resolveBase();
  try {
    console.debug(`[contributorEvents] UPDATE -> ${base}/${id}/`, body);
  } catch (e) {}
  return request(`${base}/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteContributorEvent(id: string) {
  const base = await resolveBase();
  try {
    console.debug(`[contributorEvents] DELETE -> ${base}/${id}/`);
  } catch (e) {}
  return request(`${base}/${id}/`, { method: "DELETE" });
}
