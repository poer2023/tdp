import { NextResponse } from 'next/server';
import type { TechStackData } from '@/types/bento-data';

/**
 * Tech stack API for Bento cards
 * Fetches from GitHub language statistics via /api/about/live/dev
 */
export async function GET() {
  try {
    // Fetch GitHub language data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/about/live/dev`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn('GitHub language data not available, using fallback');
      return NextResponse.json(getFallbackTechStackData());
    }

    const liveData = await response.json();

    // Handle missing language data
    if (!liveData || !liveData.languages || liveData.languages.length === 0) {
      console.warn('No language data available, using fallback');
      return NextResponse.json(getFallbackTechStackData());
    }

    // Extract top 6 languages
    const tags = liveData.languages
      .slice(0, 6)
      .map((lang: { name: string }) => lang.name);

    // Generate "learning" section from recent repos with new languages
    const allLanguages = new Set(liveData.languages.map((l: { name: string }) => l.name));
    const recentRepos = liveData.activeRepos || [];
    const newLanguages = recentRepos
      .map((repo: { language: string | null }) => repo.language)
      .filter(
        (lang: string | null) => lang && !allLanguages.has(lang)
      )
      .slice(0, 2);

    const learning = newLanguages.length > 0
      ? newLanguages.join(', ') + '...'
      : 'Rust, WebAssembly...';

    const data: TechStackData = {
      tags,
      learning,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching tech stack data:', error);
    return NextResponse.json(getFallbackTechStackData());
  }
}

/**
 * Fallback data when API fails
 */
function getFallbackTechStackData(): TechStackData {
  return {
    tags: ['React', 'Node.js', 'Python', 'Go', 'Docker', 'PostgreSQL'],
    learning: 'Rust, WebAssembly...',
  };
}
