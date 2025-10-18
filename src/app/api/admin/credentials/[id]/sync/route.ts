/**
 * Trigger Sync from Credential API
 * POST /api/admin/credentials/:id/sync
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGamingSyncService } from "@/lib/gaming/sync-service";
import { syncBilibili, syncDouban } from "@/lib/media-sync";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch credential from database
    const credential = await prisma.externalCredential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    if (!credential.isValid) {
      return NextResponse.json(
        { error: "Credential is invalid. Please validate first." },
        { status: 400 }
      );
    }

    // Trigger sync based on platform
    let syncResult;

    switch (credential.platform) {
      case "STEAM": {
        // Extract Steam ID from metadata or environment
        const steamId =
          (credential.metadata as { steamId?: string })?.steamId ||
          process.env.STEAM_USER_ID;

        if (!steamId) {
          return NextResponse.json(
            { error: "Steam ID not found in credential metadata or environment" },
            { status: 400 }
          );
        }

        const gamingSyncService = getGamingSyncService();
        syncResult = await gamingSyncService.syncSteamData(steamId);

        // Update credential usage
        await prisma.externalCredential.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            failureCount: syncResult.success ? 0 : { increment: 1 },
            updatedAt: new Date(),
          },
        });

        break;
      }

      case "HOYOVERSE": {
        // Extract HoYo UID from metadata or environment
        const hoyoUid =
          (credential.metadata as { uid?: string })?.uid ||
          process.env.HOYO_UID;

        if (!hoyoUid) {
          return NextResponse.json(
            { error: "HoYo UID not found in credential metadata or environment" },
            { status: 400 }
          );
        }

        const gamingSyncService = getGamingSyncService();
        syncResult = await gamingSyncService.syncZZZData(hoyoUid);

        // Update credential usage
        await prisma.externalCredential.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            failureCount: syncResult.success ? 0 : { increment: 1 },
            updatedAt: new Date(),
          },
        });

        break;
      }

      case "BILIBILI": {
        // Parse Bilibili cookie
        const cookieParts: Record<string, string> = {};
        credential.value.split(';').forEach((part) => {
          const [key, value] = part.trim().split('=');
          if (key && value) {
            cookieParts[key] = value;
          }
        });

        syncResult = await syncBilibili({
          sessdata: cookieParts.SESSDATA || '',
          biliJct: cookieParts.bili_jct || '',
          buvid3: cookieParts.buvid3 || '',
        });

        // Update credential usage
        await prisma.externalCredential.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            failureCount: syncResult.success ? 0 : { increment: 1 },
            updatedAt: new Date(),
          },
        });

        break;
      }

      case "DOUBAN": {
        // Extract Douban user ID from metadata
        const userId = (credential.metadata as { userId?: string })?.userId;

        if (!userId) {
          return NextResponse.json(
            { error: "Douban user ID not found in credential metadata" },
            { status: 400 }
          );
        }

        syncResult = await syncDouban({
          userId,
          cookie: credential.value,
        });

        // Update credential usage
        await prisma.externalCredential.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            failureCount: syncResult.success ? 0 : { increment: 1 },
            updatedAt: new Date(),
          },
        });

        break;
      }

      case "JELLYFIN": {
        return NextResponse.json(
          { error: "Jellyfin sync not implemented yet" },
          { status: 501 }
        );
      }

      default:
        return NextResponse.json(
          { error: `Sync not supported for platform: ${credential.platform}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      syncResult,
    });
  } catch (error) {
    console.error("Sync trigger error:", error);
    return NextResponse.json(
      {
        error: "Failed to trigger sync",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
