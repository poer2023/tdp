import { NextResponse } from "next/server";
import type { MediaData } from "@/types/live-data";

/**
 * GET /api/about/live/media
 * Returns Jellyfin media consumption data
 */
export async function GET() {
  // TODO: Replace with real Jellyfin API integration
  const data: MediaData = {
    stats: {
      thisWeek: { movies: 3, series: 2 },
      thisMonth: { movies: 12, series: 8 },
      thisYear: { totalHours: 156, totalItems: 289 },
    },
    recentlyWatched: [
      {
        id: "1",
        type: "movie",
        title: "Dune: Part Two",
        poster: "/images/about/mock-movie-1.jpg",
        watchedAt: new Date("2024-10-16"),
        rating: 5,
      },
      {
        id: "2",
        type: "movie",
        title: "Oppenheimer",
        poster: "/images/about/mock-movie-2.jpg",
        watchedAt: new Date("2024-10-15"),
        rating: 4,
      },
      {
        id: "3",
        type: "movie",
        title: "Barbie",
        poster: "/images/about/mock-movie-3.jpg",
        watchedAt: new Date("2024-10-14"),
        rating: 3,
      },
      {
        id: "4",
        type: "series",
        title: "Breaking Bad",
        poster: "/images/about/mock-series-1.jpg",
        watchedAt: new Date("2024-10-13"),
        progress: 95,
        season: 5,
        episode: 12,
        rating: 5,
      },
      {
        id: "5",
        type: "series",
        title: "The Last of Us",
        poster: "/images/about/mock-series-2.jpg",
        watchedAt: new Date("2024-10-12"),
        progress: 40,
        season: 1,
        episode: 3,
        rating: 4,
      },
    ],
    currentlyWatching: [
      {
        id: "4",
        type: "series",
        title: "Breaking Bad",
        poster: "/images/about/mock-series-1.jpg",
        watchedAt: new Date("2024-10-13"),
        progress: 95,
        season: 5,
        episode: 12,
      },
      {
        id: "5",
        type: "series",
        title: "The Last of Us",
        poster: "/images/about/mock-series-2.jpg",
        watchedAt: new Date("2024-10-12"),
        progress: 40,
        season: 1,
        episode: 3,
      },
    ],
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
