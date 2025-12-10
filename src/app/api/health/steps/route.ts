import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/health/steps
 * Webhook endpoint for receiving Apple Health steps data from iOS Shortcuts
 *
 * Authentication: Bearer token via HEALTH_SYNC_TOKEN environment variable
 *
 * Body formats:
 * 1. Single entry: { date: "2024-12-10", steps: 12345 }
 * 2. Multiple entries: { days: [{ date: "2024-12-10", steps: 12345 }, ...] }
 */
export async function POST(request: NextRequest) {
    // Validate authorization token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const expectedToken = process.env.HEALTH_SYNC_TOKEN;

    if (!expectedToken) {
        console.error("HEALTH_SYNC_TOKEN environment variable not configured");
        return NextResponse.json(
            { error: "Service not configured" },
            { status: 503 }
        );
    }

    if (!token || token !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Debug log to see what iOS Shortcuts is sending
        console.log("[Health Steps] Received body:", JSON.stringify(body, null, 2));

        // Handle both single entry and batch formats
        let entries: Array<{ date: string; steps: number }> = [];

        if (body.days && Array.isArray(body.days)) {
            // Batch format: { days: [{ date, steps }, ...] }
            entries = body.days.map((d: { date: string; steps: string | number }) => ({
                date: String(d.date),
                steps: Number(d.steps) || 0,
            }));
        } else if (body.date !== undefined && body.steps !== undefined) {
            // Single format: { date, steps }
            // Handle steps as string or number
            const stepsValue = Number(body.steps);
            if (isNaN(stepsValue)) {
                console.error("[Health Steps] Invalid steps value:", body.steps);
                return NextResponse.json(
                    { error: "Invalid steps value", received: body },
                    { status: 400 }
                );
            }
            entries = [{ date: String(body.date), steps: stepsValue }];
        } else {
            console.error("[Health Steps] Invalid format received:", body);
            return NextResponse.json(
                { error: "Invalid format. Expected { date, steps } or { days: [...] }", received: body },
                { status: 400 }
            );
        }

        // Validate and upsert entries
        const results = await Promise.all(
            entries.map(async (entry) => {
                const date = new Date(entry.date);

                // Validate date
                if (isNaN(date.getTime())) {
                    return { date: entry.date, error: "Invalid date format" };
                }

                // Normalize to start of day (UTC)
                date.setUTCHours(0, 0, 0, 0);

                // Validate steps
                const steps = Math.max(0, Math.floor(entry.steps));

                // Upsert into database
                await prisma.stepsData.upsert({
                    where: { date },
                    create: { date, steps },
                    update: { steps },
                });

                return { date: entry.date, steps, success: true };
            })
        );

        const successCount = results.filter((r) => "success" in r && r.success).length;
        const errorCount = results.filter((r) => "error" in r).length;

        console.log(
            `[Health Steps] Synced ${successCount} entries, ${errorCount} errors`
        );

        return NextResponse.json({
            ok: true,
            synced: successCount,
            errors: errorCount,
            results,
        });
    } catch (err) {
        console.error("[Health Steps] Sync error:", err);
        return NextResponse.json(
            { error: "Failed to sync steps data" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/health/steps
 * Get recent steps data (for debugging/verification)
 */
export async function GET(request: NextRequest) {
    // Validate authorization token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const expectedToken = process.env.HEALTH_SYNC_TOKEN;

    if (!expectedToken || !token || token !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const days = Math.min(parseInt(searchParams.get("days") || "7"), 365);

        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setUTCHours(0, 0, 0, 0);

        const data = await prisma.stepsData.findMany({
            where: { date: { gte: since } },
            orderBy: { date: "desc" },
        });

        return NextResponse.json({
            days,
            count: data.length,
            data: data.map((d) => ({
                date: d.date.toISOString().split("T")[0],
                steps: d.steps,
            })),
        });
    } catch (err) {
        console.error("[Health Steps] Fetch error:", err);
        return NextResponse.json(
            { error: "Failed to fetch steps data" },
            { status: 500 }
        );
    }
}
