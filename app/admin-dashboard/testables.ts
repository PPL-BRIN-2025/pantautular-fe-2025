/* Helpers extracted for testing to avoid exporting test-only values from Next.js pages */
type HeadersMap = Record<string, string>;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }

  const m = new RegExp(/(?:^|;\s*)access_token=([^;]+)/).exec(document.cookie);
  if (m) return decodeURIComponent(m[1]);

  return null;
}

export function authHeaders(): HeadersMap {
  const h: HeadersMap = { Accept: "application/json", "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export function pickMessage(
  primary?: string | null,
  secondary?: string | null,
  tertiary?: string | null
): string | undefined {
  if (primary) return primary;
  if (secondary) return secondary;
  return tertiary ?? undefined;
}
