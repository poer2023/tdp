/**
 * Credential Sync History API
 * GET /api/admin/credentials/:id/sync-history
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withDbFallback } from "@/lib/utils/db-fallback";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch credential to verify it exists
    const credential = await withDbFallback(
      () =>
        prisma.externalCredential.findUnique({
          where: { id },
          select: { platform: true },
        }),
      () => null,
      `GET /api/admin/credentials/${id}/sync-history - verify credential`
    );

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    // Fetch sync jobs associated with this credential
    const syncJobs = await withDbFallback(
      () =>
        prisma.syncJobLog.findMany({
          where: {
            credentialId: id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        }),
      () => [],
      `GET /api/admin/credentials/${id}/sync-history - fetch jobs`
    );

    // Get total count
    const totalCount = await withDbFallback(
      () =>
        prisma.syncJobLog.count({
          where: {
            credentialId: id,
          },
        }),
      () => 0,
      `GET /api/admin/credentials/${id}/sync-history - count total`
    );

    // Calculate statistics
    const stats = {
      total: totalCount,
      success: await withDbFallback(
        () =>
          prisma.syncJobLog.count({
            where: { credentialId: id, status: "SUCCESS" },
          }),
        () => 0,
        `GET /api/admin/credentials/${id}/sync-history - count success`
      ),
      failed: await withDbFallback(
        () =>
          prisma.syncJobLog.count({
            where: { credentialId: id, status: "FAILED" },
          }),
        () => 0,
        `GET /api/admin/credentials/${id}/sync-history - count failed`
      ),
      partial: await withDbFallback(
        () =>
          prisma.syncJobLog.count({
            where: { credentialId: id, status: "PARTIAL" },
          }),
        () => 0,
        `GET /api/admin/credentials/${id}/sync-history - count partial`
      ),
    };

    return NextResponse.json({
      syncJobs,
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Fetch sync history error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sync history",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
