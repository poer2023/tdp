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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
      case CredentialPlatform.STEAM: {
        // Extract Steam ID from metadata or environment
        const steamId =
          (credential.metadata as { steamId?: string })?.steamId || process.env.STEAM_USER_ID;

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
        const hoyoUid = (credential.metadata as { uid?: string })?.uid || process.env.HOYO_UID;

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
        const metadata = credential.metadata as { userId?: string; user_id?: string };
        const userId = metadata.userId || metadata.user_id;

        console.log(`[Douban Sync] Credential ${credential.id}`);
        console.log(`[Douban Sync] Metadata:`, JSON.stringify(metadata));
        console.log(`[Douban Sync] Extracted userId: ${userId || "(missing)"}`);

        if (!userId) {
          console.error(
            `[Douban Sync] Missing userId in metadata for credential ${credential.id}`
          );
          return NextResponse.json(
            {
              error: "Douban user ID not found in credential metadata",
              details: `Metadata: ${JSON.stringify(metadata)}. Please add 'user_id' or 'userId' field.`,
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

        // Extract username from metadata if available
        const metadata = credential.metadata as { username?: string } | null;
        const username = metadata?.username;

        // Run GitHub sync
        syncResult = await syncGitHub({ token, username }, credential.id);

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
