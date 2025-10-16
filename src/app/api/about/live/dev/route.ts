import { NextResponse } from "next/server";
import type { DevData } from "@/types/live-data";

/**
 * GET /api/about/live/dev
 * Returns GitHub development activity data
 */
export async function GET() {
  // TODO: Replace with real GitHub API integration
  const data: DevData = {
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

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}

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
