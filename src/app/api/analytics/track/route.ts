import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface TrackPayload {
  path?: string;
  locale?: string | null;
  fingerprint?: string;
  referer?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as TrackPayload;
    const path = typeof data.path === "string" ? data.path : null;
    const fingerprint = typeof data.fingerprint === "string" ? data.fingerprint : null;
    const locale = typeof data.locale === "string" ? data.locale : null;
    const referer = typeof data.referer === "string" ? data.referer : null;

    // Validate required fields
    if (!path || !fingerprint) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get current date at UTC 0:00 for daily stats aggregation
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Execute all database operations in parallel for performance
    await Promise.all([
      // 1. Record page view
      prisma.pageView.create({
        data: {
          id: randomUUID(),
          path,
          locale,
          referer,
        },
      }),

      // 2. Update or create visitor record
      prisma.visitor.upsert({
        where: { fingerprint },
        create: {
          id: randomUUID(),
          fingerprint,
          firstVisit: new Date(),
          lastVisit: new Date(),
          visitCount: 1,
        },
        update: {
          lastVisit: new Date(),
          visitCount: { increment: 1 },
        },
      }),

      // 3. Update daily statistics (aggregated for performance)
      prisma.dailyStats.upsert({
        where: { date: today },
        create: {
          id: randomUUID(),
          date: today,
          totalViews: 1,
          uniqueVisitors: 1,
        },
        update: {
          totalViews: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Return success even on error to avoid breaking user experience
    return NextResponse.json({ ok: true });
  }
}
