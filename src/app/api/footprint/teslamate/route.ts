/**
 * TeslaMate Sync API
 * Syncs drives from TeslaMate API to Footprint database
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TeslaMateClient, getMockTeslaMateDrives } from "@/lib/footprint/teslamate";

export async function GET() {
    try {
        // Return sync status
        const teslamateCount = await prisma.footprint.count({
            where: { source: "TESLAMATE" },
        });

        return NextResponse.json({
            status: "connected",
            syncedDrives: teslamateCount,
            lastSync: null, // TODO: store last sync time
        });
    } catch (error) {
        console.error("TeslaMate status error:", error);
        return NextResponse.json({ status: "error", error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get("mock") === "true";

    try {
        let drives;

        if (useMock) {
            // Use mock data for development
            drives = getMockTeslaMateDrives();
        } else {
            // Fetch from real TeslaMate API
            const client = new TeslaMateClient();

            // Get drives from last 30 days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            drives = await client.getDrives({ startDate });

            // Fetch positions for each drive
            drives = await Promise.all(
                drives.map(async (drive) => {
                    try {
                        return await client.getDrive(drive.id);
                    } catch {
                        return drive; // Return without positions if fetch fails
                    }
                })
            );
        }

        // Convert and upsert each drive
        let synced = 0;
        let skipped = 0;

        for (const drive of drives) {
            const footprint = TeslaMateClient.driveToFootprint(drive);

            // Check if already exists by matching time and source
            const existing = await prisma.footprint.findFirst({
                where: {
                    source: "TESLAMATE",
                    startTime: footprint.startTime,
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            await prisma.footprint.create({
                data: {
                    ...footprint,
                    metadata: footprint.metadata as object,
                },
            });
            synced++;
        }

        // Also sync cities
        const { syncCitiesFromFootprints } = await import("@/lib/footprint/city");
        await syncCitiesFromFootprints();

        return NextResponse.json({
            success: true,
            synced,
            skipped,
            total: drives.length,
            useMock,
        });
    } catch (error) {
        console.error("TeslaMate sync error:", error);
        return NextResponse.json({
            success: false,
            error: String(error),
            hint: useMock ? undefined : "Try adding ?mock=true to use mock data",
        }, { status: 500 });
    }
}
