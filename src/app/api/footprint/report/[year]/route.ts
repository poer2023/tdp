/**
 * Annual Report API
 * Returns comprehensive yearly statistics for annual report feature
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ReportData {
    year: number;
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    citiesCount: number;
    topCities: { name: string; visits: number }[];
    typeBreakdown: { type: string; trips: number; distance: number }[];
    longestTrip: { title: string | null; distance: number; date: string } | null;
    mostActiveMonth: { month: number; trips: number } | null;
    avgTripsPerWeek: number;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ year: string }> }
) {
    const { year: yearParam } = await params;
    const year = parseInt(yearParam);

    if (isNaN(year) || year < 2000 || year > 2100) {
        return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    try {
        const startDate = new Date(`${year}-01-01T00:00:00Z`);
        const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);

        // Get all footprints for the year
        const footprints = await prisma.footprint.findMany({
            where: {
                startTime: { gte: startDate, lt: endDate },
            },
            orderBy: { distance: "desc" },
        });

        if (footprints.length === 0) {
            return NextResponse.json({ error: "No data for this year" }, { status: 404 });
        }

        // Calculate aggregates
        let totalDistance = 0;
        let totalDuration = 0;
        const typeStats: Record<string, { trips: number; distance: number }> = {};
        const monthlyTrips: Record<number, number> = {};
        const citySet = new Set<string>();

        for (let m = 1; m <= 12; m++) monthlyTrips[m] = 0;

        for (const fp of footprints) {
            totalDistance += fp.distance || 0;
            totalDuration += fp.duration || 0;

            // Type breakdown
            const typeStat = typeStats[fp.type];
            if (typeStat) {
                typeStat.trips++;
                typeStat.distance += fp.distance || 0;
            } else {
                typeStats[fp.type] = { trips: 1, distance: fp.distance || 0 };
            }

            // Monthly count
            const month = fp.startTime.getMonth() + 1;
            if (monthlyTrips[month] !== undefined) {
                monthlyTrips[month]++;
            }

            // Collect cities
            if (fp.startAddr) citySet.add(fp.startAddr.split("市")[0] + "市");
            if (fp.endAddr) citySet.add(fp.endAddr.split("市")[0] + "市");
        }

        // Get cities with visits
        const cities = await prisma.city.findMany({
            where: { visits: { gt: 0 } },
            orderBy: { visits: "desc" },
            take: 3,
        });

        // Find longest trip
        const firstFp = footprints[0];
        const longestTrip = firstFp && firstFp.distance
            ? {
                title: firstFp.title,
                distance: firstFp.distance,
                date: firstFp.startTime.toISOString().split("T")[0] || "",
            }
            : null;

        // Find most active month
        const sortedMonths = Object.entries(monthlyTrips)
            .map(([m, trips]) => ({ month: parseInt(m), trips }))
            .sort((a, b) => b.trips - a.trips);
        const mostActiveMonth = sortedMonths[0] && sortedMonths[0].trips > 0 ? sortedMonths[0] : null;

        // Calculate average trips per week
        const weeksInYear = 52;
        const avgTripsPerWeek = Math.round((footprints.length / weeksInYear) * 10) / 10;

        const report: ReportData = {
            year,
            totalTrips: footprints.length,
            totalDistance: Math.round(totalDistance * 10) / 10,
            totalDuration: Math.round(totalDuration),
            citiesCount: cities.length,
            topCities: cities.map((c: { name: string; visits: number }) => ({ name: c.name, visits: c.visits })),
            typeBreakdown: Object.entries(typeStats).map(([type, stats]) => ({
                type,
                trips: stats.trips,
                distance: Math.round(stats.distance * 10) / 10,
            })),
            longestTrip,
            mostActiveMonth,
            avgTripsPerWeek,
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error("Report API error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
