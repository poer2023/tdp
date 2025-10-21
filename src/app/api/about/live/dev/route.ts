import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DevData } from "@/types/live-data";
import { GitHubClient } from "@/lib/github-client";
import { decryptCredential, isEncrypted } from "@/lib/encryption";

// Resolve Prisma client (supports both default and named exports)
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Fetch real GitHub data using credentials from database
 */
async function fetchRealGitHubData(): Promise<DevData | null> {
  try {
    // Find GitHub credential from database
    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: "GITHUB",
        isValid: true,
      },
      orderBy: {
        lastUsedAt: "desc",
      },
      take: 1,
    });

    if (credentials.length === 0) {
      console.log("[GitHub API] No valid GitHub credentials found in database");
      return null;
    }

    const credential = credentials[0];
    if (!credential) {
      console.log("[GitHub API] Credential is undefined");
      return null;
    }

    // Decrypt credential if encrypted
    const token = isEncrypted(credential.value)
      ? decryptCredential(credential.value)
      : credential.value;

    // Extract username from metadata if available
    const metadata = credential.metadata as { username?: string } | null;
    const username = metadata?.username;

    // Initialize GitHub client
    const client = new GitHubClient({ token, username });

    // Calculate time periods
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Fetch data in parallel
    const [
      activeRepos,
      contributionGraph,
      currentStreak,
      commitsThisWeek,
      commitsThisMonth,
      totalStars,
      prThisMonth,
      allRepos,
    ] = await Promise.all([
      client.getActiveRepositories(5),
      client.getContributionGraph(),
      client.getCurrentStreak(),
      client.getCommitCount({ since: oneWeekAgo }),
      client.getCommitCount({ since: oneMonthAgo }),
      client.getTotalStars(),
      client.getPullRequests({ state: "all", since: oneMonthAgo }),
      client.getRepositories({ perPage: 100 }),
    ]);

    // Count repos with activity in different periods
    const reposThisWeek = activeRepos.filter((repo) => {
      const pushedAt = new Date(repo.pushed_at || 0);
      return pushedAt >= oneWeekAgo;
    }).length;

    const reposThisYear = allRepos.filter((repo) => {
      const createdAt = new Date(repo.created_at);
      return createdAt >= oneYearAgo;
    }).length;

    // Calculate language statistics from active repos
    const languageCounts: Record<string, number> = {};
    activeRepos.forEach((repo) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });

    const totalLangRepos = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);
    const languages = Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalLangRepos) * 100),
        hours: parseFloat(((count / totalLangRepos) * 35).toFixed(1)), // Estimate hours
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

    // Prepare active repos data
    const activeReposData = await Promise.all(
      activeRepos.map(async (repo) => {
        const commits = await client
          .getRepoCommits(repo.owner.login, repo.name, {
            since: oneMonthAgo.toISOString(),
            perPage: 1,
          })
          .catch(() => []);

        const commitsCount = await client
          .getRepoCommits(repo.owner.login, repo.name, {
            since: oneMonthAgo.toISOString(),
            perPage: 100,
          })
          .then((c) => c.length)
          .catch(() => 0);

        return {
          name: repo.name,
          fullName: repo.full_name,
          language: repo.language,
          commitsThisMonth: commitsCount,
          lastCommit: commits[0]
            ? {
                date: new Date(commits[0].commit.committer.date),
                message: commits[0].commit.message.split("\n")[0] || "",
              }
            : {
                date: new Date(repo.pushed_at || repo.updated_at),
                message: "No recent commits",
              },
        };
      })
    );

    const data: DevData = {
      stats: {
        thisWeek: {
          commits: commitsThisWeek,
          repos: reposThisWeek,
        },
        thisMonth: {
          commits: commitsThisMonth,
          pullRequests: prThisMonth,
        },
        thisYear: {
          stars: totalStars,
          repos: reposThisYear,
        },
        currentStreak,
      },
      contributionHeatmap: contributionGraph,
      activeRepos: activeReposData,
      languages,
    };

    // Update credential usage stats
    await prisma.externalCredential.update({
      where: { id: credential.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    return data;
  } catch (error) {
    console.error("[GitHub API] Error fetching real data:", error);
    return null;
  }
}

/**
 * Cached GitHub data fetcher (15 minutes cache)
 */
const getCachedGitHubData = unstable_cache(
  async () => {
    return await fetchRealGitHubData();
  },
  ["github-dev-data"],
  {
    revalidate: 900, // Cache for 15 minutes
    tags: ["github-dev-data"],
  }
);

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
      contributionHeatmap: [],
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
