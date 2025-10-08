import { NextResponse } from "next/server";
import { publishDueScheduled } from "@/lib/moments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const count = await publishDueScheduled();
  return NextResponse.json({ updated: count });
}
