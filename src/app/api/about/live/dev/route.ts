import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DevData } from "@/types/live-data";

// Resolve Prisma client (supports both default and named exports)
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Fetch GitHub data from database (synced data)
 */
async function fetchGitHubDataFromDB(): Promise<DevData | null> {
  try {
    console.log("[GitHub DB] Fetching synced GitHub data from database");

    // Access optional delegates dynamically to avoid type errors when models are absent
    const p: any = prisma as unknown as any;

    // Fetch latest stats snapshot
    let latestStats = null;
    if (p.gitHubStats?.findFirst) {
      latestStats = await p.gitHubStats.findFirst({
        orderBy: { syncedAt: "desc" },
      });
    }

    if (!latestStats) {
      console.log("[GitHub DB] No stats data found in database");
      return null;
    }

    // Fetch contribution heatmap (365 days)
    let contributions: Array<{ date: Date; value: number }> = [];
    if (p.gitHubContribution?.findMany) {
      const contributionRecords = await p.gitHubContribution.findMany({
        orderBy: { date: "desc" },
        take: 365,
      });
      contributions = contributionRecords.map((c: { date: Date; value: number }) => ({
        date: c.date,
        value: c.value,
      }));
    }

    // Fetch active repos
    let activeRepos: Array<{
      name: string;
      fullName: string;
      language: string | null;
      commitsThisMonth: number;
      lastCommit: { date: Date; message: string };
    }> = [];
    if (p.gitHubRepo?.findMany) {
      const repoRecords = await p.gitHubRepo.findMany({
        where: { isActive: true },
        orderBy: { syncedAt: "desc" },
        take: 5,
      });
      activeRepos = repoRecords.map(
        (r: {
          name: string;
          fullName: string;
          language: string | null;
          commitsThisMonth: number;
          lastCommitDate: Date;
          lastCommitMsg: string;
        }) => ({
          name: r.name,
          fullName: r.fullName,
          language: r.language,
          commitsThisMonth: r.commitsThisMonth,
          lastCommit: {
            date: r.lastCommitDate,
            message: r.lastCommitMsg,
          },
        })
      );
    }

    // Fetch latest language statistics (dedupe by name, keep newest, max 4)
    const languages: Array<{ name: string; percentage: number; hours: number }> = [];
    if (p.gitHubLanguage?.findMany) {
      // Fetch a window of recent records to ensure we can dedupe to unique names
      const langRecords = await p.gitHubLanguage.findMany({
        orderBy: { syncedAt: "desc" },
        take: 50,
      });

      const seen = new Set<string>();
      for (const l of langRecords) {
        const name = (l as { name: string }).name;
        if (name && !seen.has(name)) {
          seen.add(name);
          languages.push({
            name,
            percentage: (l as { percentage: number }).percentage,
            hours: (l as { hours: number }).hours,
          });
        }
        if (languages.length >= 4) break;
      }
    }

    // Derive a corrected streak from contributions to safeguard against old snapshots
    let derivedStreak = 0;
    if (contributions.length > 0) {
      const sortedByDate = [...contributions].sort((a, b) => b.date.getTime() - a.date.getTime());
      const startIndex = sortedByDate[0]?.value === 0 ? 1 : 0;
      for (let i = startIndex; i < sortedByDate.length; i++) {
        const day = sortedByDate[i];
        if (!day) break;
        if (day.value > 0) derivedStreak++;
        else break;
      }
    }

    const data: DevData = {
      stats: {
        thisWeek: {
          commits: latestStats.commitsWeek,
          repos: latestStats.reposWeek,
        },
        thisMonth: {
          commits: latestStats.commitsMonth,
          pullRequests: latestStats.prsMonth,
        },
        thisYear: {
          stars: latestStats.starsYear,
          repos: latestStats.reposYear,
        },
        // Prefer stored snapshot but correct it when contributions imply a longer streak
        currentStreak: Math.max(latestStats.currentStreak, derivedStreak),
      },
      contributionHeatmap: contributions,
      activeRepos,
      languages: languages.length > 0 ? languages : undefined,
    };

    console.log("[GitHub DB] Successfully fetched GitHub data from database");
    return data;
  } catch (error) {
    console.error("[GitHub DB] Error fetching data from database:", error);
    return null;
  }
}

/**
 * Cached GitHub data fetcher (15 minutes cache)
 */
const getGitHubDataBase = async () => {
  return await fetchGitHubDataFromDB();
};

// In test/CI environments, skip caching to avoid incrementalCache requirement
const getCachedGitHubData =
  process.env.NODE_ENV === "test" || process.env.CI === "true"
    ? getGitHubDataBase
    : unstable_cache(getGitHubDataBase, ["github-dev-data"], {
        revalidate: 900, // Cache for 15 minutes
        tags: ["github-dev-data"],
      });

/**
 * GET /api/about/live/dev
 * Returns GitHub development activity data from database
 * Returns null if no data available (no mock fallback)
 */
export async function GET() {
  try {
    // Fetch real data from cache
    const data = await getCachedGitHubData();

    if (data) {
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }

    // No data available - return null instead of mock data
    console.log("[GitHub API] No data available in database");
    return NextResponse.json(null, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
      status: 404,
    });
  } catch (error) {
    console.error("[GitHub API] Error in route handler:", error);

    // Return null on error instead of mock data
    return NextResponse.json(null, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
      status: 500,
    });
  }
}
