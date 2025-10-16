import { NextResponse } from "next/server";
import type { LiveHighlightsData } from "@/types/live-data";

/**
 * GET /api/about/highlights
 * Returns lightweight summary data for the main about page
 */
export async function GET() {
  // TODO: Replace with real data fetching from respective APIs
  const data: LiveHighlightsData = {
    highlights: [
      {
        module: "media",
        icon: "🎬",
        title: "Recently Watched",
        subtitle: "Dune: Part Two",
        value: "3 this week",
        trend: "up",
        href: "/about/live/media",
      },
      {
        module: "gaming",
        icon: "🎮",
        title: "Now Playing",
        subtitle: "Elden Ring",
        value: "45h this month",
        trend: "stable",
        href: "/about/live/gaming",
      },
      {
        module: "infra",
        icon: "🖥️",
        title: "Infrastructure",
        subtitle: "3 servers",
        value: "All healthy",
        trend: "stable",
        href: "/about/live/infra",
      },
      {
        module: "dev",
        icon: "💻",
        title: "GitHub Activity",
        subtitle: "47 commits",
        value: "This week",
        trend: "up",
        href: "/about/live/dev",
      },
      {
        module: "reading",
        icon: "📚",
        title: "Currently Reading",
        subtitle: "System Design Interview",
        value: "2 books",
        trend: "stable",
        href: "/about/live/reading",
      },
      {
        module: "social",
        icon: "💬",
        title: "Social Activity",
        subtitle: "45 conversations",
        value: "This week",
        trend: "up",
        href: "/about/live/social",
      },
      {
        module: "finance",
        icon: "💰",
        title: "Subscriptions",
        subtitle: "5 active",
        value: "This month",
        trend: "stable",
        href: "/about/live/finance",
      },
    ],
    lastUpdated: new Date(),
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
