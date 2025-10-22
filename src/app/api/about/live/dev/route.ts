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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Generate mock GitHub heatmap (fallback)
 */
function generateMockGitHubHeatmap() {
  const heatmap: Array<{ date: Date; value: number }> = [];
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    heatmap.push({
      date,
      value: Math.random() < 0.8 ? Math.floor(Math.random() * 10) : 0,
    });
  }
  return heatmap;
}

/**
 * GET /api/about/live/dev
 * Returns GitHub development activity data (real or mock)
 */
export async function GET() {
  try {
    // Try to fetch real data from cache
    const realData = await getCachedGitHubData();

    if (realData) {
      return NextResponse.json(realData, {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }

    // Fallback to mock data if no credentials available
    console.log("[GitHub API] Using mock data (no valid credentials)");
    const mockData: DevData = {
      stats: {
        thisWeek: { commits: 47, repos: 3 },
        thisMonth: { commits: 189, pullRequests: 8 },
        thisYear: { stars: 2345, repos: 34 },
        currentStreak: 47,
      },
      contributionHeatmap: generateMockGitHubHeatmap(),
      activeRepos: [
        {
          name: "tdp",
          fullName: "wanghao/tdp",
          language: "TypeScript",
          commitsThisMonth: 47,
          lastCommit: {
            date: new Date(Date.now() - 2 * 60 * 60 * 1000),
            message: "feat: add about page dynamic content",
          },
        },
        {
          name: "blog",
          fullName: "wanghao/blog",
          language: "MDX",
          commitsThisMonth: 12,
          lastCommit: {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            message: "post: Next.js 15 new features",
          },
        },
      ],
      languages: [
        { name: "TypeScript", percentage: 67, hours: 23.4 },
        { name: "Python", percentage: 21, hours: 7.3 },
        { name: "Markdown", percentage: 8, hours: 2.8 },
        { name: "Other", percentage: 4, hours: 1.4 },
      ],
    };

    return NextResponse.json(mockData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[GitHub API] Error in route handler:", error);

    // Return mock data on error
    const mockData: DevData = {
      stats: {
        thisWeek: { commits: 0, repos: 0 },
        thisMonth: { commits: 0, pullRequests: 0 },
        thisYear: { stars: 0, repos: 0 },
        currentStreak: 0,
      },
      contributionHeatmap: generateMockGitHubHeatmap(),
      activeRepos: [],
      languages: [],
    };

    return NextResponse.json(mockData, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}
