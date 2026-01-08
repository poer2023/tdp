/**
 * User Status Module
 * Fetches real-time status data for the "At a Glance" widget
 */

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { shouldSkipDb } from "@/lib/utils/db-fallback";

export interface StatusItem {
    key: string;
    label: string;
    value: string;
    icon: "zap" | "film" | "gamepad2" | "book" | "music" | "code";
    url?: string;
    progress?: number;
}

export interface AtAGlanceData {
    items: StatusItem[];
    updatedAt: Date;
}

/**
 * Get the latest movie/series being watched from MediaWatch table
 */
async function getLatestWatching(): Promise<StatusItem | null> {
    if (shouldSkipDb()) return null;
    try {
        const latest = await prisma.mediaWatch.findFirst({
            where: {
                type: { in: ["movie", "series"] },
            },
            orderBy: { watchedAt: "desc" },
            select: {
                title: true,
                type: true,
                url: true,
                watchedAt: true,
                progress: true,
            },
        });

        if (!latest) return null;

        return {
            key: "watching",
            label: "Watching",
            value: latest.title,
            icon: "film",
            url: latest.url || undefined,
            progress: latest.progress || undefined,
        };
    } catch (error) {
        console.error("[UserStatus] Error fetching latest watching:", error);
        return null;
    }
}

/**
 * Get the latest game being played from GameSession table
 */
async function getLatestPlaying(): Promise<StatusItem | null> {
    if (shouldSkipDb()) return null;
    try {
        const latestSession = await prisma.gameSession.findFirst({
            orderBy: { startTime: "desc" },
            include: {
                game: {
                    select: {
                        name: true,
                        nameZh: true,
                        platformId: true,
                        platform: true,
                    },
                },
            },
        });

        if (!latestSession?.game) return null;

        const game = latestSession.game;
        const gameName = game.nameZh || game.name;

        // Build Steam URL if it's a Steam game
        let url: string | undefined;
        if (game.platform === "STEAM") {
            url = `https://store.steampowered.com/app/${game.platformId}`;
        }

        return {
            key: "playing",
            label: "Playing",
            value: gameName,
            icon: "gamepad2",
            url,
        };
    } catch (error) {
        console.error("[UserStatus] Error fetching latest playing:", error);
        return null;
    }
}

/**
 * Get current focus from UserStatus table (or fallback to default)
 * For Phase 1, we use a simple approach with environment variable or default
 */
async function getCurrentFocus(): Promise<StatusItem | null> {
    if (shouldSkipDb()) {
        return {
            key: "focusing",
            label: "Focusing on",
            value: process.env.CURRENT_FOCUS || "Product Strategy",
            icon: "zap",
        };
    }
    try {
        // Try to get from UserStatus table if it exists
        const p = prisma as any;
        if (p.userStatus?.findFirst) {
            const focus = await p.userStatus.findFirst({
                where: { key: "focusing", isActive: true },
                orderBy: { updatedAt: "desc" },
            });

            if (focus) {
                return {
                    key: "focusing",
                    label: focus.label || "Focusing on",
                    value: focus.value,
                    icon: "zap",
                    url: focus.url || undefined,
                };
            }
        }

        // Fallback: Use environment variable or default
        const focusValue = process.env.CURRENT_FOCUS || "Product Strategy";

        return {
            key: "focusing",
            label: "Focusing on",
            value: focusValue,
            icon: "zap",
        };
    } catch {
        // Table doesn't exist yet, use default
        return {
            key: "focusing",
            label: "Focusing on",
            value: process.env.CURRENT_FOCUS || "Product Strategy",
            icon: "zap",
        };
    }
}

/**
 * Get all status items for the At a Glance widget
 */
async function _fetchAtAGlanceStatus(): Promise<AtAGlanceData> {
    const [focusing, watching, playing] = await Promise.all([
        getCurrentFocus(),
        getLatestWatching(),
        getLatestPlaying(),
    ]);

    const items: StatusItem[] = [];
    let latestUpdate = new Date(0);

    // Add focusing (always present)
    if (focusing) {
        items.push(focusing);
    }

    // Add watching if available
    if (watching) {
        items.push(watching);
    }

    // Add playing if available
    if (playing) {
        items.push(playing);
    }

    // Calculate the most recent update time
    // For now, just use current time as we don't have per-item timestamps in return
    // In a real implementation, we'd track the watchedAt/startTime
    if (!shouldSkipDb()) {
        try {
            const [latestMedia, latestGame] = await Promise.all([
                prisma.mediaWatch.findFirst({
                    orderBy: { watchedAt: "desc" },
                    select: { watchedAt: true },
                }),
                prisma.gameSession.findFirst({
                    orderBy: { startTime: "desc" },
                    select: { startTime: true },
                }),
            ]);

            if (latestMedia?.watchedAt && latestMedia.watchedAt > latestUpdate) {
                latestUpdate = latestMedia.watchedAt;
            }
            if (latestGame?.startTime && latestGame.startTime > latestUpdate) {
                latestUpdate = latestGame.startTime;
            }
        } catch {
            // Ignore errors, use default
        }
    }

    // If no updates found, use current time
    if (latestUpdate.getTime() === 0) {
        latestUpdate = new Date();
    }

    return {
        items,
        updatedAt: latestUpdate,
    };
}

// Cached version with 5 minute TTL
const getCachedAtAGlanceStatus = unstable_cache(
    _fetchAtAGlanceStatus,
    ["at-a-glance-status"],
    { revalidate: 300, tags: ["user-status"] }
);

/**
 * Get At a Glance status with caching
 * Can be called from Server Components directly
 */
export async function getAtAGlanceStatus(): Promise<AtAGlanceData> {
    return getCachedAtAGlanceStatus();
}

/**
 * Format relative time for display
 * @param date Date or date string to format
 * @param locale Locale for formatting (en or zh)
 */
export function formatRelativeTime(date: Date | string, locale: string = "en"): string {
    // Handle both Date objects and serialized date strings (from cache)
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Safety check for invalid dates
    if (!dateObj || Number.isNaN(dateObj.getTime())) {
        return locale === "zh" ? "刚刚" : "just now";
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (locale === "zh") {
        if (diffMins < 1) return "刚刚";
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffHours < 24) return `${diffHours} 小时前`;
        if (diffDays < 7) return `${diffDays} 天前`;
        return `${Math.floor(diffDays / 7)} 周前`;
    } else {
        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins} MIN AGO`;
        if (diffHours < 24) return `${diffHours} HRS AGO`;
        if (diffDays < 7) return `${diffDays} DAYS AGO`;
        return `${Math.floor(diffDays / 7)} WEEKS AGO`;
    }
}
