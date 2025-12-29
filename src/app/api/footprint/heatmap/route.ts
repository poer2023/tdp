/**
 * Footprint Heatmap API
 * Returns aggregated point data for heatmap visualization
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodePolyline } from "@/lib/footprint/gpx-parser";

// Geohash precision 6 ≈ 1.2km grid cells
const GEOHASH_PRECISION = 6;

// Simple geohash encoding for aggregation
function encodeGeohash(lat: number, lng: number, precision: number = 6): string {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let hash = "";
    let isLng = true;
    let bits = 0;
    let charIndex = 0;

    while (hash.length < precision) {
        if (isLng) {
            const mid = (minLng + maxLng) / 2;
            if (lng >= mid) {
                charIndex = (charIndex << 1) | 1;
                minLng = mid;
            } else {
                charIndex = charIndex << 1;
                maxLng = mid;
            }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) {
                charIndex = (charIndex << 1) | 1;
                minLat = mid;
            } else {
                charIndex = charIndex << 1;
                maxLat = mid;
            }
        }
        isLng = !isLng;
        bits++;

        if (bits === 5) {
            hash += BASE32[charIndex];
            bits = 0;
            charIndex = 0;
        }
    }
    return hash;
}

// Decode geohash to center point
function decodeGeohashCenter(hash: string): [number, number] {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let isLng = true;

    for (const char of hash) {
        const idx = BASE32.indexOf(char);
        for (let i = 4; i >= 0; i--) {
            const bit = (idx >> i) & 1;
            if (isLng) {
                const mid = (minLng + maxLng) / 2;
                if (bit) minLng = mid;
                else maxLng = mid;
            } else {
                const mid = (minLat + maxLat) / 2;
                if (bit) minLat = mid;
                else maxLat = mid;
            }
            isLng = !isLng;
        }
    }

    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    try {
        // Build date filter
        const where: Record<string, unknown> = {};
        if (year) {
            const startDate = new Date(`${year}-01-01T00:00:00Z`);
            const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`);
            where.startTime = { gte: startDate, lt: endDate };
        }

        // Get all footprints with polylines
        const footprints = await prisma.footprint.findMany({
            where: { ...where, polyline: { not: null } },
            select: { polyline: true },
        });

        // Aggregate points by geohash
        const pointCounts = new Map<string, number>();

        for (const fp of footprints) {
            if (!fp.polyline) continue;
            const coords = decodePolyline(fp.polyline);

            // Sample every Nth point to reduce density
            const sampleRate = Math.max(1, Math.floor(coords.length / 50));

            for (let i = 0; i < coords.length; i += sampleRate) {
                const coord = coords[i];
                if (!coord) continue;
                const [lng, lat] = coord;
                const hash = encodeGeohash(lat, lng, GEOHASH_PRECISION);
                pointCounts.set(hash, (pointCounts.get(hash) || 0) + 1);
            }
        }

        // Convert to GeoJSON
        const features = Array.from(pointCounts.entries()).map(([hash, count]) => {
            const [lng, lat] = decodeGeohashCenter(hash);
            return {
                type: "Feature" as const,
                geometry: {
                    type: "Point" as const,
                    coordinates: [lng, lat],
                },
                properties: { count },
            };
        });

        return NextResponse.json({
            type: "FeatureCollection",
            features,
        });
    } catch (error) {
        console.error("Heatmap API error:", error);
        return NextResponse.json({ error: "Failed to generate heatmap data" }, { status: 500 });
    }
}
