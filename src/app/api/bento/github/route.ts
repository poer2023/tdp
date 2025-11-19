import { NextResponse } from 'next/server';
import type { GitHubData } from '@/types/bento-data';

/**
 * GitHub contribution data API for Bento cards
 * Fetches from synced database via /api/about/live/dev
 */
export async function GET() {
  try {
    // Fetch real synced GitHub data from database
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/about/live/dev`, {
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (!response.ok) {
      console.warn('GitHub live data not available, using fallback');
      return NextResponse.json(getFallbackGitHubData());
    }

    const liveData = await response.json();

    // Handle case where no data is available (404 from live API)
    if (!liveData || !liveData.contributionHeatmap) {
      console.warn('No GitHub data in database, using fallback');
      return NextResponse.json(getFallbackGitHubData());
    }

    // Convert 365-day heatmap to 40-week format
    const contributions = convertTo40Weeks(liveData.contributionHeatmap);

    // Format total commits display
    const totalCommits = liveData.stats.thisYear.commits || 0;
    const formattedCommits =
      totalCommits > 1000 ? `${(totalCommits / 1000).toFixed(1)}k` : totalCommits.toString();

    const data: GitHubData = {
      totalCommits: formattedCommits,
      contributions,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json(getFallbackGitHubData());
  }
}

/**
 * Convert 365-day contribution heatmap to 40-week format for Bento card
 * Groups days into weeks and calculates intensity levels (0-4)
 */
function convertTo40Weeks(
  heatmap: Array<{ date: Date | string; value: number }>
): number[] {
  // Sort by date descending (most recent first)
  const sorted = [...heatmap]
    .map((item) => ({
      date: typeof item.date === 'string' ? new Date(item.date) : item.date,
      value: item.value,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group into weeks (7 days each)
  const weeks: number[] = [];
  for (let i = 0; i < 40; i++) {
    const weekStart = i * 7;
    const weekEnd = weekStart + 7;
    const weekData = sorted.slice(weekStart, weekEnd);

    if (weekData.length === 0) {
      weeks.push(0);
      continue;
    }

    // Calculate average activity for the week
    const weekTotal = weekData.reduce((sum, day) => sum + day.value, 0);
    const weekAvg = weekTotal / weekData.length;

    // Convert to intensity level (0-4)
    let intensity = 0;
    if (weekAvg >= 10) intensity = 4;
    else if (weekAvg >= 6) intensity = 3;
    else if (weekAvg >= 3) intensity = 2;
    else if (weekAvg >= 1) intensity = 1;

    weeks.push(intensity);
  }

  // Reverse to show oldest → newest (left to right)
  return weeks.reverse();
}

/**
 * Fallback data when database is empty or API fails
 */
function getFallbackGitHubData(): GitHubData {
  return {
    totalCommits: '1.2k',
    contributions: [
      0, 1, 2, 3, 4, 2, 3, 1, 4, 2, 3, 1, 0, 2, 4, 3, 2, 1, 3, 4, 2, 1, 3, 0,
      4, 2, 3, 1, 2, 4, 1, 3, 2, 0, 4, 3, 1, 2, 3, 4,
    ],
  };
}
