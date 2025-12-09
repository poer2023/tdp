/**
 * Steam Playtime Snapshot Service
 * Handles creating daily playtime snapshots and calculating deltas
 */

import prisma from "@/lib/prisma";
import { createSteamClient } from "@/lib/gaming/steam-client";
import { startOfDay, subDays } from "date-fns";

export interface PlaytimeSnapshotResult {
    success: boolean;
    gamesUpdated: number;
    totalGames: number;
    snapshotDate: Date;
    errors?: string[];
}

/**
 * Create playtime snapshots for all games owned by a Steam user
 */
export async function createPlaytimeSnapshots(
    steamId: string,
    apiKey: string
): Promise<PlaytimeSnapshotResult> {
    const errors: string[] = [];
    let gamesUpdated = 0;

    try {
        // 1. Fetch all owned games from Steam API
        const steamClient = createSteamClient(apiKey);
        const games = await steamClient.getOwnedGames(steamId);

        const today = startOfDay(new Date());
        const yesterday = subDays(today, 1);

        // 2. Process each game
        for (const game of games) {
            try {
                // Find or create Game record
                const gameRecord = await prisma.game.upsert({
                    where: {
                        platform_platformId: {
                            platform: "STEAM",
                            platformId: game.appId.toString(),
                        },
                    },
                    update: {
                        name: game.name,
                        cover: game.imgIconUrl
                            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appId}/${game.imgIconUrl}.jpg`
                            : null,
                    },
                    create: {
                        platformId: game.appId.toString(),
                        platform: "STEAM",
                        name: game.name,
                        cover: game.imgIconUrl
                            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appId}/${game.imgIconUrl}.jpg`
                            : null,
                    },
                });

                // 3. Check if snapshot for today already exists
                const existingSnapshot = await prisma.gamePlaytimeSnapshot.findUnique({
                    where: {
                        gameId_steamId_snapshotAt: {
                            gameId: gameRecord.id,
                            steamId,
                            snapshotAt: today,
                        },
                    },
                });

                if (existingSnapshot) {
                    // Update existing snapshot
                    await prisma.gamePlaytimeSnapshot.update({
                        where: { id: existingSnapshot.id },
                        data: { playtime: game.playtimeForever },
                    });
                } else {
                    // 4. Get yesterday's snapshot to calculate delta
                    const yesterdaySnapshot = await prisma.gamePlaytimeSnapshot.findUnique({
                        where: {
                            gameId_steamId_snapshotAt: {
                                gameId: gameRecord.id,
                                steamId,
                                snapshotAt: yesterday,
                            },
                        },
                    });

                    const dailyDelta = yesterdaySnapshot
                        ? game.playtimeForever - yesterdaySnapshot.playtime
                        : null; // First time, no delta

                    // 5. Create today's snapshot
                    await prisma.gamePlaytimeSnapshot.create({
                        data: {
                            gameId: gameRecord.id,
                            steamId,
                            playtime: game.playtimeForever,
                            snapshotAt: today,
                            dailyDelta,
                        },
                    });
                }

                gamesUpdated++;
            } catch (error) {
                const errorMsg = `Failed to process game ${game.name}: ${error instanceof Error ? error.message : String(error)}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        return {
            success: true,
            gamesUpdated,
            totalGames: games.length,
            snapshotDate: today,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error("Failed to create playtime snapshots:", error);
        return {
            success: false,
            gamesUpdated,
            totalGames: 0,
            snapshotDate: new Date(),
            errors: [error instanceof Error ? error.message : String(error)],
        };
    }
}

/**
 * Get playtime history for a specific game
 */
export async function getGamePlaytimeHistory(
    gameId: string,
    steamId: string,
    startDate?: Date,
    endDate?: Date
) {
    const where: any = {
        gameId,
        steamId,
    };

    if (startDate || endDate) {
        where.snapshotAt = {};
        if (startDate) where.snapshotAt.gte = startDate;
        if (endDate) where.snapshotAt.lte = endDate;
    }

    const snapshots = await prisma.gamePlaytimeSnapshot.findMany({
        where,
        orderBy: { snapshotAt: "asc" },
        include: {
            game: {
                select: {
                    name: true,
                    cover: true,
                },
            },
        },
    });

    return snapshots;
}

/**
 * Get daily playtime summary for all games
 */
export async function getDailyPlaytimeSummary(steamId: string, date?: Date) {
    const targetDate = date ? startOfDay(date) : startOfDay(new Date());

    const snapshots = await prisma.gamePlaytimeSnapshot.findMany({
        where: {
            steamId,
            snapshotAt: targetDate,
            dailyDelta: {
                gt: 0, // Only games with playtime today
            },
        },
        orderBy: {
            dailyDelta: "desc",
        },
        include: {
            game: {
                select: {
                    name: true,
                    cover: true,
                    platformId: true,
                },
            },
        },
    });

    return snapshots;
}

/**
 * Get total playtime for a date range
 */
export async function getTotalPlaytimeInRange(
    steamId: string,
    startDate: Date,
    endDate: Date
) {
    const snapshots = await prisma.gamePlaytimeSnapshot.findMany({
        where: {
            steamId,
            snapshotAt: {
                gte: startDate,
                lte: endDate,
            },
            dailyDelta: {
                not: null,
            },
        },
    });

    const totalMinutes = snapshots.reduce((sum, snapshot) => sum + (snapshot.dailyDelta || 0), 0);

    return {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        daysCount: snapshots.length,
        averagePerDay: snapshots.length > 0 ? Math.round(totalMinutes / snapshots.length) : 0,
    };
}
