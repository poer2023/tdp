/**
 * Trigger Sync from Credential API
 * POST /api/admin/credentials/:id/sync
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGamingSyncService } from "@/lib/gaming/sync-service";
import { syncBilibili, syncDouban, syncSteam, syncGitHub } from "@/lib/media-sync";
import { decryptCredential, isEncrypted } from "@/lib/encryption";
import { CredentialPlatform } from "@prisma/client";
import { startSyncLog, completeSyncLog } from "@/lib/sync-logger";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let syncLogId: string | undefined;

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

    // Start sync log
    const syncLog = await startSyncLog({
      credentialId: id,
      platform: credential.platform,
      triggerType: 'MANUAL', // User clicked sync button
    });
    syncLogId = syncLog.id;

    // Trigger sync based on platform
    let syncResult;

    switch (credential.platform) {
      case CredentialPlatform.STEAM: {
        // Extract Steam ID from metadata or environment
        const metadata = credential.metadata as { steamId?: string } | null;
        const steamId = metadata?.steamId || process.env.STEAM_USER_ID;

        if (!steamId) {
          return NextResponse.json(
            { error: "Steam ID not found in credential metadata or environment" },
            { status: 400 }
          );
        }

        // Resolve API key (supports encrypted/plaintext)
        const apiKey = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        // Run both gaming sync (for SteamProfile) and media sync (for MediaWatch) in parallel
        const [gamingSyncResult, mediaSyncResult] = await Promise.all([
          getGamingSyncService().syncSteamData(steamId, apiKey),
          syncSteam({ apiKey, steamId }, credential.id),
        ]);

        // Combine results
        syncResult = {
          success: gamingSyncResult.success && mediaSyncResult.success,
          gamingSync: gamingSyncResult,
          mediaSync: mediaSyncResult,
          message: `Steam synced: ${gamingSyncResult.gamesUpdated || 0} gaming profiles, ${mediaSyncResult.itemsNew || 0} new media items`,
        };

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

      case CredentialPlatform.HOYOVERSE: {
        // Extract HoYo UID from metadata or environment
        const metadata = credential.metadata as { uid?: string } | null;
        const hoyoUid = metadata?.uid || process.env.HOYO_UID;

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

      case CredentialPlatform.BILIBILI: {
        // Resolve cookie (supports encrypted/plaintext)
        const cookieValue = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        // Parse Bilibili cookie
        const cookieParts: Record<string, string> = {};
        cookieValue.split(";").forEach((part) => {
          const [key, value] = part.trim().split("=");
          if (key && value) {
            cookieParts[key] = value;
          }
        });

        syncResult = await syncBilibili(
          {
            sessdata: cookieParts.SESSDATA || "",
            biliJct: cookieParts.bili_jct || "",
            buvid3: cookieParts.buvid3 || "",
          },
          credential.id
        );

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

      case CredentialPlatform.DOUBAN: {
        // Extract Douban user ID from metadata (support both user_id and userId formats)
        const metadata = credential.metadata as { userId?: string; user_id?: string } | null;

        console.log(`[Douban Sync] Credential ${credential.id}`);
        console.log(`[Douban Sync] Metadata:`, JSON.stringify(metadata));

        // Check if metadata exists first to prevent TypeError
        if (!metadata) {
          console.error(`[Douban Sync] Missing metadata for credential ${credential.id}`);
          return NextResponse.json(
            {
              error: "Douban credential metadata is missing",
              details:
                "Please validate the credential first to automatically populate user ID, or contact admin to update metadata with 'userId' field.",
              action:
                "Click the 'Validate' button to automatically extract user ID from your cookie",
            },
            { status: 400 }
          );
        }

        const userId = metadata.userId || metadata.user_id;
        console.log(`[Douban Sync] Extracted userId: ${userId || "(missing)"}`);

        if (!userId) {
          console.error(`[Douban Sync] Missing userId in metadata for credential ${credential.id}`);
          return NextResponse.json(
            {
              error: "Douban user ID not found in credential metadata",
              details: `Metadata exists but userId is missing. Please validate the credential to automatically extract user ID.`,
              action: "Click the 'Validate' button to automatically populate user ID",
              currentMetadata: metadata,
            },
            { status: 400 }
          );
        }

        // Resolve cookie (supports encrypted/plaintext)
        const cookieValue = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        console.log(`[Douban Sync] Cookie length: ${cookieValue.length} chars`);

        syncResult = await syncDouban(
          {
            userId,
            cookie: cookieValue,
          },
          credential.id
        );

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

      case CredentialPlatform.GITHUB: {
        // Extract GitHub Personal Access Token from credential value
        const token = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        // Note: We intentionally don't pass username here.
        // The sync will automatically fetch the authenticated user from the token,
        // ensuring we always sync the correct user's contribution data.
        syncResult = await syncGitHub({ token }, credential.id);

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

      case CredentialPlatform.JELLYFIN: {
        return NextResponse.json({ error: "Jellyfin sync not implemented yet" }, { status: 501 });
      }

      default:
        return NextResponse.json(
          { error: `Sync not supported for platform: ${credential.platform}` },
          { status: 400 }
        );
    }

    // Complete sync log with results
    if (syncLogId && syncResult) {
      // For Steam, use mediaSync result which matches SyncResult type
      // For other platforms, syncResult directly matches SyncResult
      if ('mediaSync' in syncResult) {
        // Steam combined result - use mediaSync for logging
        await completeSyncLog(syncLogId, syncResult.mediaSync);
      } else if ('itemsTotal' in syncResult) {
        // Standard media sync result (BILIBILI, DOUBAN, GITHUB)
        await completeSyncLog(syncLogId, syncResult);
      } else {
        // Gaming sync result (HOYOVERSE) - convert to compatible format
        await completeSyncLog(syncLogId, {
          platform: String(syncResult.platform).toLowerCase(),
          success: syncResult.success,
          itemsTotal: syncResult.gamesUpdated ?? 0,
          itemsSuccess: syncResult.gamesUpdated ?? 0,
          itemsFailed: 0,
          itemsNew: syncResult.gamesUpdated ?? 0,
          itemsExisting: 0,
          duration: 0,
          error: syncResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncResult,
      syncLogId, // Include log ID in response
    });
  } catch (error) {
    console.error("Sync trigger error:", error);

    // Mark sync log as failed if we have a log ID
    if (syncLogId) {
      try {
        await completeSyncLog(syncLogId, {
          platform: 'unknown',
          success: false,
          itemsTotal: 0,
          itemsSuccess: 0,
          itemsFailed: 0,
          itemsNew: 0,
          itemsExisting: 0,
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      } catch (logError) {
        console.error("Failed to update sync log:", logError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to trigger sync",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
