/**
 * Steam Playtime History API
 * GET /api/admin/steam/playtime-history
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getGamePlaytimeHistory,
    getDailyPlaytimeSummary,
    getTotalPlaytimeInRange,
} from "@/lib/gaming/playtime-snapshot-service";
import { startOfDay, subDays } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const steamId = searchParams.get("steamId");
        const gameId = searchParams.get("gameId");
        const type = searchParams.get("type") || "history"; // history | summary | total

        if (!steamId) {
            return NextResponse.json({ error: "steamId is required" }, { status: 400 });
        }

        // Daily summary - games played today with delta
        if (type === "summary") {
            const dateParam = searchParams.get("date");
            const date = dateParam ? new Date(dateParam) : undefined;
            const summary = await getDailyPlaytimeSummary(steamId, date);

            return NextResponse.json({
                success: true,
                data: summary.map((s) => ({
                    gameId: s.gameId,
                    gameName: s.game.name,
                    gameCover: s.game.cover,
                    appId: s.game.platformId,
                    playtime: s.playtime,
                    dailyDelta: s.dailyDelta,
                    snapshotAt: s.snapshotAt,
                })),
            });
        }

        // Total playtime in range
        if (type === "total") {
            const startDate = searchParams.get("startDate");
            const endDate = searchParams.get("endDate");

            const start = startDate ? new Date(startDate) : subDays(startOfDay(new Date()), 30);
            const end = endDate ? new Date(endDate) : startOfDay(new Date());

            const totalStats = await getTotalPlaytimeInRange(steamId, start, end);

            return NextResponse.json({
                success: true,
                ...totalStats,
                startDate: start,
                endDate: end,
            });
        }

        // Game history
        if (!gameId) {
            return NextResponse.json(
                { error: "gameId is required for history type" },
                { status: 400 }
            );
        }

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const history = await getGamePlaytimeHistory(
            gameId,
            steamId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        return NextResponse.json({
            success: true,
            data: history.map((h) => ({
                date: h.snapshotAt,
                playtime: h.playtime,
                dailyDelta: h.dailyDelta,
                gameName: h.game.name,
                gameCover: h.game.cover,
            })),
        });
    } catch (error) {
        console.error("Playtime history error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch playtime history",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
