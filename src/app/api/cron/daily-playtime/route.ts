/**
 * Daily Playtime Sync Cron Job
 * Automatically refresh playtime for all Steam credentials daily
 * 
 * Vercel Cron: Add to vercel.json
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-playtime",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPlaytimeSnapshots } from "@/lib/gaming/playtime-snapshot-service";
import { decryptCredential, isEncrypted } from "@/lib/encryption";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] Starting daily playtime sync...");

        // Get all valid Steam credentials
        const credentials = await prisma.externalCredential.findMany({
            where: {
                platform: "STEAM",
                isValid: true,
            },
        });

        console.log(`[Cron] Found ${credentials.length} Steam credentials`);

        const results = [];

        for (const credential of credentials) {
            try {
                const metadata = credential.metadata as { steamId?: string } | null;
                const steamId = metadata?.steamId || process.env.STEAM_USER_ID;

                if (!steamId) {
                    console.warn(`[Cron] Skipping credential ${credential.id}: No Steam ID`);
                    continue;
                }

                // Decrypt API key
                const apiKey = isEncrypted(credential.value)
                    ? decryptCredential(credential.value)
                    : credential.value;

                // Create snapshots
                console.log(`[Cron] Processing Steam ID: ${steamId}`);
                const result = await createPlaytimeSnapshots(steamId, apiKey);

                results.push({
                    steamId,
                    credentialId: credential.id,
                    success: result.success,
                    gamesUpdated: result.gamesUpdated,
                });

                console.log(
                    `[Cron] Completed for ${steamId}: ${result.gamesUpdated}/${result.totalGames} games`
                );
            } catch (error) {
                console.error(
                    `[Cron] Failed to process credential ${credential.id}:`,
                    error
                );
                results.push({
                    credentialId: credential.id,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        console.log("[Cron] Daily playtime sync completed");

        return NextResponse.json({
            success: true,
            processedCount: credentials.length,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron] Daily playtime sync failed:", error);
        return NextResponse.json(
            {
                error: "Cron job failed",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
