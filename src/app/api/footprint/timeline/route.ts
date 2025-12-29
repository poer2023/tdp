/**
 * Footprint Timeline/Stats API
 * Returns aggregated stats by year/month for timeline filtering
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    try {
        if (year) {
            // Get monthly breakdown for a specific year
            const startDate = new Date(`${year}-01-01T00:00:00Z`);
            const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`);

            const footprints = await prisma.footprint.findMany({
                where: {
                    startTime: { gte: startDate, lt: endDate },
                },
                select: {
                    startTime: true,
                    distance: true,
                    duration: true,
                    type: true,
                },
            });

            // Group by month
            const monthlyStats: Record<number, { trips: number; distance: number; duration: number }> = {};
            for (let m = 1; m <= 12; m++) {
                monthlyStats[m] = { trips: 0, distance: 0, duration: 0 };
            }

            for (const fp of footprints) {
                const month = fp.startTime.getMonth() + 1; // 1-12
                const stats = monthlyStats[month];
                if (stats) {
                    stats.trips++;
                    stats.distance += fp.distance || 0;
                    stats.duration += fp.duration || 0;
                }
            }

            return NextResponse.json({
                year: parseInt(year),
                months: Object.entries(monthlyStats).map(([month, stats]) => ({
                    month: parseInt(month),
                    ...stats,
                })),
            });
        } else {
            // Get yearly breakdown (all years)
            const footprints = await prisma.footprint.findMany({
                select: {
                    startTime: true,
                    distance: true,
                    duration: true,
                },
                orderBy: { startTime: "asc" },
            });

            if (footprints.length === 0) {
                return NextResponse.json({ years: [] });
            }

            // Group by year
            const yearlyStats: Record<number, { trips: number; distance: number; duration: number }> = {};

            for (const fp of footprints) {
                const year = fp.startTime.getFullYear();
                if (!yearlyStats[year]) {
                    yearlyStats[year] = { trips: 0, distance: 0, duration: 0 };
                }
                yearlyStats[year].trips++;
                yearlyStats[year].distance += fp.distance || 0;
                yearlyStats[year].duration += fp.duration || 0;
            }

            return NextResponse.json({
                years: Object.entries(yearlyStats)
                    .map(([year, stats]) => ({
                        year: parseInt(year),
                        ...stats,
                    }))
                    .sort((a, b) => b.year - a.year), // Most recent first
            });
        }
    } catch (error) {
        console.error("Timeline API error:", error);
        return NextResponse.json({ error: "Failed to fetch timeline data" }, { status: 500 });
    }
}
