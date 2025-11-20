import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/config";

const BACKEND_NEWS_PATH = "/api/news";

const buildBackendUrl = (req: NextRequest) => {
  const url = new URL(BACKEND_NEWS_PATH, API_BASE);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url;
};

export async function GET(req: NextRequest) {
  try {
    const targetUrl = buildBackendUrl(req);
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const body = await res.json().catch(() => null);
    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    console.error("Failed to proxy /api/news:", error);
    return NextResponse.json({ detail: "Failed to reach news service" }, { status: 502 });
  }
}
