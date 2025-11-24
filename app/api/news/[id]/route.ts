import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/config";

const BACKEND_NEWS_PATH = "/api/news";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ detail: "News ID is required" }, { status: 400 });
  }

  try {
    const targetUrl = new URL(`${BACKEND_NEWS_PATH}/${encodeURIComponent(id)}`, API_BASE);
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    console.error(`Failed to proxy /api/news/${id}:`, error);
    return NextResponse.json({ detail: "Failed to reach news service" }, { status: 502 });
  }
}
