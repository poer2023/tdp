/**
 * Cities API
 * Returns visited cities for map markers
 */

import { NextResponse } from "next/server";
import { getVisitedCities, syncCitiesFromFootprints } from "@/lib/footprint/city";

export async function GET() {
    try {
        const cities = await getVisitedCities();

        // Convert to GeoJSON for map markers
        const features = cities.map((city) => ({
            type: "Feature" as const,
            geometry: {
                type: "Point" as const,
                coordinates: [city.lng, city.lat],
            },
            properties: {
                id: city.id,
                code: city.code,
                name: city.name,
                nameEn: city.nameEn,
                visits: city.visits,
                firstVisit: city.firstVisit?.toISOString(),
                lastVisit: city.lastVisit?.toISOString(),
            },
        }));

        return NextResponse.json({
            type: "FeatureCollection",
            features,
        });
    } catch (error) {
        console.error("Cities API error:", error);
        return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }
}

// POST to trigger sync
export async function POST() {
    try {
        const count = await syncCitiesFromFootprints();
        return NextResponse.json({ synced: count });
    } catch (error) {
        console.error("Cities sync error:", error);
        return NextResponse.json({ error: "Failed to sync cities" }, { status: 500 });
    }
}
