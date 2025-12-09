/**
 * Steam Playtime Refresh API
 * POST /api/admin/steam/refresh-playtime
 */

import { NextRequest, NextResponse } from "next/server";
import { createPlaytimeSnapshots } from "@/lib/gaming/playtime-snapshot-service";
import prisma from "@/lib/prisma";
import { decryptCredential, isEncrypted } from "@/lib/encryption";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { credentialId } = body;

        if (!credentialId) {
            return NextResponse.json(
                { error: "credentialId is required" },
                { status: 400 }
            );
        }

        // Fetch Steam credential
        const credential = await prisma.externalCredential.findUnique({
            where: { id: credentialId },
        });

        if (!credential || credential.platform !== "STEAM") {
            return NextResponse.json(
                { error: "Steam credential not found" },
                { status: 404 }
            );
        }

        // Extract Steam ID from metadata
        const metadata = credential.metadata as { steamId?: string } | null;
        const steamId = metadata?.steamId || process.env.STEAM_USER_ID;

        if (!steamId) {
            return NextResponse.json(
                { error: "Steam ID not found in credential metadata" },
                { status: 400 }
            );
        }

        // Decrypt API key
        const apiKey = isEncrypted(credential.value)
            ? decryptCredential(credential.value)
            : credential.value;

        // Create snapshots
        const result = await createPlaytimeSnapshots(steamId, apiKey);

        return NextResponse.json({
            success: result.success,
            gamesUpdated: result.gamesUpdated,
            totalGames: result.totalGames,
            snapshotDate: result.snapshotDate.toISOString(),
            errors: result.errors,
        });
    } catch (error) {
        console.error("Playtime refresh error:", error);
        return NextResponse.json(
            {
                error: "Failed to refresh playtime",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
