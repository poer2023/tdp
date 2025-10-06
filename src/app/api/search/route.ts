import { NextResponse } from "next/server";
import { searchPosts } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const localeParam = searchParams.get("locale");
  const locale =
    localeParam && ["EN", "ZH"].includes(localeParam.toUpperCase())
      ? (localeParam.toUpperCase() as "EN" | "ZH")
      : undefined;

  // Basic input guard
  if (q.length > 64) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  if (!q) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  try {
    // Simple in-memory rate limit per IP/User-Agent
    const headers = (request as Request).headers;
    const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
    const ua = headers.get("user-agent") || "unknown";

    if (!checkRateLimit(`${ip}:${ua}`, 20, 60_000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const results = await searchPosts(q, { locale, limit: 12 });
    return NextResponse.json({ results }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

// Module-level in-memory rate limiter
const rateMap = new Map<string, number[]>();
function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = rateMap.get(key) || [];
  const keep = arr.filter((t) => now - t < windowMs);
  if (keep.length >= max) return false;
  keep.push(now);
  rateMap.set(key, keep);
  return true;
}
