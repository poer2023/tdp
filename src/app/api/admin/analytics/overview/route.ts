import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Get period parameter from query string
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate cutoff date based on period
    const cutoffDate = (() => {
      if (period === 'all') return null;
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    })();

    const [daily, pageViews, devices] = await Promise.all([
      prisma.dailyStats.findMany({
        where: cutoffDate ? { date: { gte: cutoffDate } } : undefined,
        orderBy: { date: "asc" },
        take: 120,
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: cutoffDate ? { createdAt: { gte: cutoffDate } } : undefined,
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 50,
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: cutoffDate ? { createdAt: { gte: cutoffDate } } : undefined,
        _count: { device: true },
      }),
    ]);

    const trafficData = daily.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      visits: d.totalViews,
      unique: d.uniqueVisitors,
    }));

    // Referer aggregation (source)
    const referers = await prisma.pageView.groupBy({
      by: ["referer"],
      where: cutoffDate ? { createdAt: { gte: cutoffDate } } : undefined,
      _count: { referer: true },
      orderBy: { _count: { referer: "desc" } },
      take: 20,
    });

    const sourceData = referers
      .filter((r) => r.referer)
      .map((r, idx) => ({
        name: r.referer ?? "Direct",
        value: r._count.referer,
        color: ["#4ADE80", "#60A5FA", "#FBBF24", "#F472B6", "#A78BFA"][idx % 5],
      }));

    const pageVisitData = pageViews.map((pv) => ({
      path: pv.path,
      title: pv.path,
      visits: pv._count.path,
    }));

    const deviceData = devices.map((d, idx) => ({
      name: d.device,
      value: d._count.device,
      color: ["#6366F1", "#22C55E", "#F97316", "#64748B", "#EAB308"][idx % 5],
    }));

    return NextResponse.json({
      trafficData,
      sourceData,
      pageVisitData,
      deviceData,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin Analytics] overview failed", error);
    return NextResponse.json({ error: "Failed to fetch analytics overview" }, { status: 500 });
  }
}
