import { API_BASE } from "../config";
import type { ChartFilters, ChartsPayload } from "../types/curatorCharts";

const API_BASE_URL = API_BASE ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`Request failed: ${res.status}${detail ? ` ${detail}` : ""}`);
  }
  return res.json();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: buildHeaders(),
    cache: "no-store",
    ...init,
  });
  return handleResponse<T>(res);
}

export async function getCharts(): Promise<ChartsPayload> {
  return request<ChartsPayload>("/curator-feature/charts");
}

export async function getChartsFiltered(filters: ChartFilters): Promise<ChartsPayload> {
  return request<ChartsPayload>("/curator-feature/charts/filter", {
    method: "POST",
    body: JSON.stringify(filters),
  });
}
