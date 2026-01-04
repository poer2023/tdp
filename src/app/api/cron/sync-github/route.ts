/**
 * GitHub Sync Cron Job
 * GET/POST /api/cron/sync-github
 * Triggered by Vercel Cron or manual invocation
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CredentialPlatform } from "@prisma/client";
import { syncGitHub } from "@/lib/media-sync";
import { decryptCredential, isEncrypted } from "@/lib/encryption";

/**
 * GET /api/cron/sync-github
 * Sync all GitHub accounts from database credentials
 */
export async function GET(request: NextRequest) {
  // Verify authorization (Vercel Cron or internal secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {

    // Fetch all valid GitHub credentials
    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: CredentialPlatform.GITHUB,
        isValid: true,
      },
    });

    if (credentials.length === 0) {

      return NextResponse.json({
        success: true,
        message: "No GitHub credentials to sync",
        results: [],
      });
    }

    // Sync all GitHub accounts concurrently
    const syncPromises = credentials.map(async (credential) => {
      try {
        // Decrypt token if encrypted
        const token = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        // Extract username from metadata if available
        const metadata = credential.metadata as { username?: string } | null;
        const username = metadata?.username;

        // Run sync
        const result = await syncGitHub({ token, username }, credential.id);

        // Update credential usage stats
        await prisma.externalCredential.update({
          where: { id: credential.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            failureCount: result.success ? 0 : { increment: 1 },
            updatedAt: new Date(),
          },
        });

        return {
          credentialId: credential.id,
          username: username || "Unknown",
          ...result,
        };
      } catch (error) {
        console.error(`[GitHub Cron] Error syncing credential ${credential.id}:`, error);
        return {
          credentialId: credential.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          itemsTotal: 0,
          itemsSuccess: 0,
          itemsFailed: 0,
          itemsNew: 0,
          itemsExisting: 0,
          duration: 0,
        };
      }
    });

    const results = await Promise.all(syncPromises);

    const summary = {
      totalAccounts: credentials.length,
      successAccounts: results.filter((r) => r.success).length,
      failedAccounts: results.filter((r) => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    console.error("[GitHub Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sync-github
 * Alternative endpoint for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
