import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type NowPlayingData = {
    id: string;
    trackName: string;
    artistName: string;
    albumName: string | null;
    artworkUrl: string | null;
    duration: number | null;
    playedAt: Date;
    source: string;
};

// Type for data from database
type NowPlayingRecord = NowPlayingData;

/**
 * Get the most recently played track
 */
export async function getCurrentlyPlaying(): Promise<NowPlayingData | null> {
    try {
        const p = prisma as any;
        if (!p.nowPlaying?.findFirst) return null;

        const track = await p.nowPlaying.findFirst({
            orderBy: { playedAt: "desc" },
        });
        return track as NowPlayingData | null;
    } catch {
        return null;
    }
}

/**
 * Get recent tracks (cached for 60 seconds)
 */
export const getRecentTracks = unstable_cache(
    async (limit: number = 10): Promise<NowPlayingData[]> => {
        try {
            const p = prisma as any;
            if (!p.nowPlaying?.findMany) return [];

            const tracks = await p.nowPlaying.findMany({
                orderBy: { playedAt: "desc" },
                take: limit,
            });
            return tracks as NowPlayingData[];
        } catch {
            return [];
        }
    },
    ["now-playing-recent"],
    { revalidate: 60, tags: ["now-playing"] }
);

/**
 * Add a new track to the history
 */
export async function addNowPlaying(data: {
    trackName: string;
    artistName: string;
    albumName?: string | null;
    artworkUrl?: string | null;
    duration?: number | null;
    source?: string;
}): Promise<NowPlayingRecord> {
    const p = prisma as any;

    // Check if the same track was played in the last 2 minutes (avoid duplicates)
    const recentTrack = await p.nowPlaying.findFirst({
        where: {
            trackName: data.trackName,
            artistName: data.artistName,
            playedAt: {
                gte: new Date(Date.now() - 2 * 60 * 1000),
            },
        },
        orderBy: { playedAt: "desc" },
    });

    if (recentTrack) {
        // Update existing record's playedAt
        return p.nowPlaying.update({
            where: { id: recentTrack.id },
            data: { playedAt: new Date() },
        });
    }

    return p.nowPlaying.create({
        data: {
            trackName: data.trackName,
            artistName: data.artistName,
            albumName: data.albumName ?? null,
            artworkUrl: data.artworkUrl ?? null,
            duration: data.duration ?? null,
            source: data.source ?? "apple_music",
        },
    });
}
