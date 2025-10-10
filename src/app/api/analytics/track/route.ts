import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { path, locale, fingerprint, referer } = await req.json();

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
          path,
          locale: locale || null,
          referer: referer || null,
        },
      }),

      // 2. Update or create visitor record
      prisma.visitor.upsert({
        where: { fingerprint },
        create: {
          fingerprint,
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
