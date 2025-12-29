import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { LiveHighlightsData, LiveHighlight } from "@/types/live-data";

/**
 * Cached provider for About Live highlights.
 * - RSC safe
 * - Tag-based revalidation via `about-highlights`
 * - Fetches real data from database
 */
const getLiveHighlightsDataBase = async (): Promise<LiveHighlightsData> => {
  const highlights: LiveHighlight[] = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Fetch data in parallel
    const [
      mediaThisWeek,
      latestMedia,
      gamingData,
      devData,
      subscriptionCount,
      infraStatus,
    ] = await Promise.all([
      // Media this week
      prisma.mediaWatch.count({
        where: { watchedAt: { gte: oneWeekAgo } },
      }),
      // Latest watched media
      prisma.mediaWatch.findFirst({
        orderBy: { watchedAt: "desc" },
        select: { title: true },
      }),
      // Gaming data
      getGamingHighlight(oneMonthAgo),
      // Dev data
      getDevHighlight(),
      // Finance (subscription count)
      prisma.subscription.count(),
      // Infra status
      getInfraHighlight(),
    ]);

    // Media highlight
    highlights.push({
      module: "media",
      icon: "🎬",
      title: "Recently Watched",
      subtitle: latestMedia?.title || "No recent activity",
      value: `${mediaThisWeek} this week`,
      trend: mediaThisWeek > 0 ? "up" : "stable",
      href: "/about/media",
    });

    // Gaming highlight
    if (gamingData) {
      highlights.push({
        module: "gaming",
        icon: "🎮",
        title: "Now Playing",
        subtitle: gamingData.gameName,
        value: `${gamingData.hoursThisMonth}h this month`,
        trend: gamingData.hoursThisMonth > 10 ? "up" : "stable",
        href: "/about/gaming",
      });
    }

    // Infra highlight
    if (infraStatus) {
      highlights.push({
        module: "infra",
        icon: "🖥️",
        title: "Infrastructure",
        subtitle: `${infraStatus.serviceCount} services`,
        value: infraStatus.allHealthy ? "All healthy" : "Issues detected",
        trend: infraStatus.allHealthy ? "stable" : "down",
        href: "/about/infra",
      });
    }

    // Dev highlight
    if (devData) {
      highlights.push({
        module: "dev",
        icon: "💻",
        title: "GitHub Activity",
        subtitle: `${devData.commitsThisWeek} commits`,
        value: "This week",
        trend: devData.commitsThisWeek > 10 ? "up" : "stable",
        href: "/about/dev",
      });
    }

    // Reading highlight (placeholder until implemented)
    highlights.push({
      module: "reading",
      icon: "📚",
      title: "Currently Reading",
      subtitle: "Coming soon",
      value: "—",
      trend: "stable",
      href: "/about/reading",
    });

    // Social highlight (placeholder - privacy sensitive)
    highlights.push({
      module: "social",
      icon: "💬",
      title: "Social Activity",
      subtitle: "Privacy protected",
      value: "—",
      trend: "stable",
      href: "/about/social",
    });

    // Finance highlight
    highlights.push({
      module: "finance",
      icon: "💰",
      title: "Subscriptions",
      subtitle: `${subscriptionCount} active`,
      value: "This month",
      trend: "stable",
      href: "/about/finance",
    });
  } catch (error) {
    console.error("[Live Highlights] Error fetching data:", error);
    // Return minimal fallback highlights on error
    return {
      highlights: [
        {
          module: "media",
          icon: "🎬",
          title: "Recently Watched",
          subtitle: "View activity",
          value: "—",
          trend: "stable",
          href: "/about/media",
        },
        {
          module: "gaming",
          icon: "🎮",
          title: "Gaming",
          subtitle: "View activity",
          value: "—",
          trend: "stable",
          href: "/about/gaming",
        },
        {
          module: "dev",
          icon: "💻",
          title: "Development",
          subtitle: "View activity",
          value: "—",
          trend: "stable",
          href: "/about/dev",
        },
      ],
      lastUpdated: new Date(),
    };
  }

  return {
    highlights,
    lastUpdated: new Date(),
  };
};

/**
 * Get gaming highlight data
 */
async function getGamingHighlight(
  oneMonthAgo: Date
): Promise<{ gameName: string; hoursThisMonth: number } | null> {
  try {
    const [latestSession, monthSessions] = await Promise.all([
      prisma.gameSession.findFirst({
        orderBy: { startTime: "desc" },
        include: { game: true },
      }),
      prisma.gameSession.findMany({
        where: { startTime: { gte: oneMonthAgo } },
        select: { duration: true },
      }),
    ]);

    if (!latestSession?.game) return null;

    const hoursThisMonth = Math.round(
      monthSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    );

    return {
      gameName: latestSession.game.nameZh || latestSession.game.name,
      hoursThisMonth,
    };
  } catch {
    return null;
  }
}

/**
 * Get dev highlight data
 */
async function getDevHighlight(): Promise<{ commitsThisWeek: number } | null> {
  try {
    const p = prisma as any;
    if (!p.gitHubStats?.findFirst) return null;

    const stats = await p.gitHubStats.findFirst({
      orderBy: { syncedAt: "desc" },
    });

    if (!stats) return null;

    return {
      commitsThisWeek: stats.commitsWeek || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get infrastructure highlight data
 */
async function getInfraHighlight(): Promise<{
  serviceCount: number;
  allHealthy: boolean;
} | null> {
  try {
    // Try to fetch from the infra API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/infra/monitors`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!res.ok) return null;

    const data = await res.json();
    const monitors = data.monitors || [];

    return {
      serviceCount: monitors.length,
      allHealthy: monitors.every(
        (m: { status: string }) => m.status === "UP"
      ),
    };
  } catch {
    return null;
  }
}

export const getLiveHighlightsData =
  process.env.NODE_ENV === "test"
    ? getLiveHighlightsDataBase
    : unstable_cache(getLiveHighlightsDataBase, ["about-highlights"], {
        revalidate: 60, // Cache for 1 minute
        tags: ["about-highlights"],
      });
