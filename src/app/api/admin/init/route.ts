/**
 * Database Initialization API
 * Creates missing tables (like SiteConfig) if they don't exist
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/admin/init
 * Initialize database tables that may be missing
 */
export async function POST() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: { table: string; status: string; error?: string }[] = [];

    // Check and create SiteConfig table
    try {
        // Try to query the table
        await prisma.$queryRaw`SELECT 1 FROM "SiteConfig" LIMIT 1`;
        results.push({ table: "SiteConfig", status: "exists" });
    } catch (error) {
        // Table doesn't exist, create it
        try {
            await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "SiteConfig" (
          "key" TEXT PRIMARY KEY,
          "value" TEXT NOT NULL,
          "encrypted" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
        )
      `;
            results.push({ table: "SiteConfig", status: "created" });
        } catch (createError) {
            results.push({
                table: "SiteConfig",
                status: "failed",
                error: createError instanceof Error ? createError.message : "Unknown error",
            });
        }
    }

    const allSuccess = results.every((r) => r.status !== "failed");

    return NextResponse.json({
        success: allSuccess,
        results,
        message: allSuccess ? "数据库初始化完成" : "部分表创建失败",
    });
}

/**
 * GET /api/admin/init
 * Check database table status
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tables: { name: string; exists: boolean }[] = [];

    // Check SiteConfig
    try {
        await prisma.$queryRaw`SELECT 1 FROM "SiteConfig" LIMIT 1`;
        tables.push({ name: "SiteConfig", exists: true });
    } catch {
        tables.push({ name: "SiteConfig", exists: false });
    }

    return NextResponse.json({ tables });
}
