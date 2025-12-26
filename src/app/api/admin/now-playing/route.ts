import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addNowPlaying, getRecentTracks } from "@/lib/now-playing";
import { revalidateTag } from "next/cache";

/**
 * GET - Fetch recent tracks
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        const tracks = await getRecentTracks(Math.min(limit, 50));

        return NextResponse.json({ tracks });
    } catch (error) {
        console.error("[NowPlaying GET] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tracks" },
            { status: 500 }
        );
    }
}

/**
 * POST - Add a new track (requires auth or API key)
 * 
 * Expected body:
 * {
 *   trackName: string (required)
 *   artistName: string (required)
 *   albumName?: string
 *   artworkUrl?: string
 *   duration?: number (seconds)
 * }
 * 
 * Can also pass api_key as query param or Authorization header for iOS Shortcuts
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication - either session or API key
        const session = await auth();
        const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "")
            || new URL(request.url).searchParams.get("api_key");

        // For iOS Shortcuts, use a simple API key from env
        const validApiKey = process.env.NOW_PLAYING_API_KEY;
        const isApiKeyValid = validApiKey && apiKey === validApiKey;

        if (!session?.user && !isApiKeyValid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.trackName || !body.artistName) {
            return NextResponse.json(
                { error: "trackName and artistName are required" },
                { status: 400 }
            );
        }

        const track = await addNowPlaying({
            trackName: body.trackName,
            artistName: body.artistName,
            albumName: body.albumName,
            artworkUrl: body.artworkUrl,
            duration: body.duration ? parseInt(body.duration, 10) : null,
            source: body.source || "apple_music",
        });

        // Revalidate cache
        revalidateTag("now-playing", "max");
        revalidateTag("dashboard", "max");

        return NextResponse.json({ success: true, track });
    } catch (error) {
        console.error("[NowPlaying POST] Error:", error);
        return NextResponse.json(
            { error: "Failed to add track" },
            { status: 500 }
        );
    }
}
