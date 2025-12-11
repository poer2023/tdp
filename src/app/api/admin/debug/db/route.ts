/**
 * Database Diagnostics API
 * Provides detailed debugging information for SiteConfig issues
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/debug/db
 * Run comprehensive database diagnostics
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diagnostics: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        checks: {},
    };

    // 1. Test basic database connection
    try {
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        diagnostics.checks = {
            ...diagnostics.checks as object,
            dbConnection: { status: "ok", result },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            dbConnection: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            },
        };
    }

    // 2. Check if SiteConfig table exists
    try {
        const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SiteConfig'
      ) as exists
    `;
        diagnostics.checks = {
            ...diagnostics.checks as object,
            siteConfigTableExists: { status: "ok", result },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            siteConfigTableExists: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            },
        };
    }

    // 3. Try to create SiteConfig table
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
        diagnostics.checks = {
            ...diagnostics.checks as object,
            createTable: { status: "ok", message: "Table created or already exists" },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            createTable: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            },
        };
    }

    // 4. Verify table exists after creation
    try {
        const result = await prisma.$queryRaw`SELECT * FROM "SiteConfig" LIMIT 5`;
        diagnostics.checks = {
            ...diagnostics.checks as object,
            selectFromTable: { status: "ok", rowCount: Array.isArray(result) ? result.length : 0, result },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            selectFromTable: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            },
        };
    }

    // 5. Try upsert with Prisma client
    try {
        await prisma.siteConfig.upsert({
            where: { key: "__test__" },
            update: { value: "test", updatedAt: new Date() },
            create: { key: "__test__", value: "test", encrypted: false },
        });
        // Clean up test record
        await prisma.siteConfig.delete({ where: { key: "__test__" } });
        diagnostics.checks = {
            ...diagnostics.checks as object,
            prismaUpsert: { status: "ok", message: "Prisma upsert works correctly" },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            prismaUpsert: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error),
                hint: "This usually means Prisma client doesn't know about SiteConfig model"
            },
        };
    }

    // 6. List all tables in public schema
    try {
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
        diagnostics.checks = {
            ...diagnostics.checks as object,
            allTables: { status: "ok", tables },
        };
    } catch (error) {
        diagnostics.checks = {
            ...diagnostics.checks as object,
            allTables: {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            },
        };
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
