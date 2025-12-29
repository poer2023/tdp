/**
 * Footprint Data Layer
 * Handles CRUD operations for footprint data
 */

import { prisma } from "@/lib/prisma";
import type { Footprint, FootprintType, FootprintSource, Prisma } from "@prisma/client";

export type { Footprint, FootprintType, FootprintSource };

export interface FootprintStats {
    totalTrips: number;
    totalDistance: number; // km
    totalDuration: number; // seconds
    byType: Record<FootprintType, { count: number; distance: number }>;
    citiesVisited: number;
    longestTrip: Footprint | null;
}

export interface FootprintListOptions {
    type?: FootprintType;
    source?: FootprintSource;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Get all footprints with optional filtering
 */
export async function listFootprints(
    options: FootprintListOptions = {}
): Promise<Footprint[]> {
    const { type, source, limit = 50, offset = 0, startDate, endDate } = options;

    const where: Prisma.FootprintWhereInput = {};

    if (type) where.type = type;
    if (source) where.source = source;
    if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = startDate;
        if (endDate) where.startTime.lte = endDate;
    }

    return prisma.footprint.findMany({
        where,
        orderBy: { startTime: "desc" },
        take: limit,
        skip: offset,
    });
}

/**
 * Get a single footprint by ID
 */
export async function getFootprint(id: string): Promise<Footprint | null> {
    return prisma.footprint.findUnique({ where: { id } });
}

/**
 * Create a new footprint
 */
export async function createFootprint(
    data: Prisma.FootprintCreateInput
): Promise<Footprint> {
    return prisma.footprint.create({ data });
}

/**
 * Create multiple footprints (for batch import)
 */
export async function createManyFootprints(
    data: Prisma.FootprintCreateManyInput[]
): Promise<number> {
    const result = await prisma.footprint.createMany({ data });
    return result.count;
}

/**
 * Update a footprint
 */
export async function updateFootprint(
    id: string,
    data: Prisma.FootprintUpdateInput
): Promise<Footprint> {
    return prisma.footprint.update({ where: { id }, data });
}

/**
 * Delete a footprint
 */
export async function deleteFootprint(id: string): Promise<void> {
    await prisma.footprint.delete({ where: { id } });
}

/**
 * Get footprint statistics
 */
export async function getFootprintStats(): Promise<FootprintStats> {
    // Get aggregates
    const aggregate = await prisma.footprint.aggregate({
        _count: true,
        _sum: {
            distance: true,
            duration: true,
        },
    });

    // Get counts by type
    const byTypeRaw = await prisma.footprint.groupBy({
        by: ["type"],
        _count: true,
        _sum: { distance: true },
    });

    const byType: FootprintStats["byType"] = {} as FootprintStats["byType"];
    for (const item of byTypeRaw) {
        byType[item.type] = {
            count: item._count,
            distance: item._sum.distance || 0,
        };
    }

    // Get unique cities (from start/end addresses)
    const citiesRaw = await prisma.footprint.findMany({
        select: { startAddr: true, endAddr: true },
        where: {
            OR: [
                { startAddr: { not: null } },
                { endAddr: { not: null } },
            ],
        },
    });

    const cities = new Set<string>();
    citiesRaw.forEach((f) => {
        if (f.startAddr) cities.add(f.startAddr);
        if (f.endAddr) cities.add(f.endAddr);
    });

    // Get longest trip
    const longestTrip = await prisma.footprint.findFirst({
        where: { distance: { not: null } },
        orderBy: { distance: "desc" },
    });

    return {
        totalTrips: aggregate._count,
        totalDistance: aggregate._sum.distance || 0,
        totalDuration: aggregate._sum.duration || 0,
        byType,
        citiesVisited: cities.size,
        longestTrip,
    };
}

/**
 * Get footprints for a specific year (for yearly heatmap)
 */
export async function getFootprintsByYear(year: number): Promise<Footprint[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    return prisma.footprint.findMany({
        where: {
            startTime: {
                gte: startDate,
                lt: endDate,
            },
        },
        orderBy: { startTime: "asc" },
    });
}

/**
 * Get all polylines for map visualization
 */
export async function getAllPolylines(): Promise<
    Array<{
        id: string;
        type: FootprintType;
        polyline: string;
        startTime: Date;
    }>
> {
    return prisma.footprint.findMany({
        select: {
            id: true,
            type: true,
            polyline: true,
            startTime: true,
        },
        where: {
            polyline: { not: null },
        },
        orderBy: { startTime: "desc" },
    }) as Promise<
        Array<{
            id: string;
            type: FootprintType;
            polyline: string;
            startTime: Date;
        }>
    >;
}
