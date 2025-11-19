import { NextResponse } from 'next/server';
import prismaDefault, { prisma as prismaNamed } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { MediaItem } from '@/types/bento-data';

// Resolve Prisma client
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Media type mapping
 */
const mediaTypeMap: Record<string, MediaItem['type']> = {
  MOVIE: 'movie',
  ANIME: 'anime',
  BOOK: 'book',
  MUSIC: 'music',
  TV_SHOW: 'anime', // Map TV shows to anime for simplicity
};

/**
 * Recently consumed media API for Bento cards
 * Fetches from MediaWatch database table
 */
export async function GET() {
  try {
    // Access Prisma dynamically to handle optional models
    const p: any = prisma as unknown as any;

    // Check if MediaWatch model exists
    if (!p.mediaWatch?.findMany) {
      console.warn('MediaWatch table not available, using fallback');
      return NextResponse.json(getFallbackMediaData());
    }

    // Fetch recent 4 media items
    const mediaRecords = await p.mediaWatch.findMany({
      orderBy: { watchedAt: 'desc' },
      take: 4,
      select: {
        type: true,
        title: true,
        cover: true,
        rating: true,
        platform: true,
        author: true,
        url: true,
      },
    });

    if (mediaRecords.length === 0) {
      console.warn('No media records found, using fallback');
      return NextResponse.json(getFallbackMediaData());
    }

    // Map to Bento card format
    const media: MediaItem[] = mediaRecords.map(
      (record: {
        type: string;
        title: string;
        cover: string | null;
        rating: number | null;
        author: string | null;
        platform: string;
      }) => ({
        type: mediaTypeMap[record.type] || 'movie',
        title: record.title,
        author: record.author || getDefaultAuthor(record.platform),
        rating: record.rating || 0,
        cover: record.cover || getDefaultCover(record.type),
      })
    );

    return NextResponse.json(media, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching media data:', error);
    return NextResponse.json(getFallbackMediaData());
  }
}

/**
 * Get default author based on platform
 */
function getDefaultAuthor(platform: string): string {
  if (platform === 'BILIBILI') return 'Bilibili';
  if (platform === 'DOUBAN') return 'Douban';
  if (platform === 'STEAM') return 'Steam';
  return 'Unknown';
}

/**
 * Get default cover for missing images
 */
function getDefaultCover(type: string): string {
  // Use placeholder images or return empty string
  return '';
}

/**
 * Fallback data when database is empty or fails
 */
function getFallbackMediaData(): MediaItem[] {
  return [
    {
      type: 'book',
      title: '三体',
      author: '刘慈欣',
      rating: 5,
      cover: 'https://img2.doubanio.com/view/subject/s/public/s2768378.jpg',
    },
    {
      type: 'movie',
      title: 'Oppenheimer',
      author: 'Christopher Nolan',
      rating: 5,
      cover:
        'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
    },
    {
      type: 'anime',
      title: "Frieren: Beyond Journey's End",
      author: 'Kanehito Yamada',
      rating: 4,
      cover:
        'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/Frieren_key_visual.jpg/220px-Frieren_key_visual.jpg',
    },
    {
      type: 'music',
      title: 'Random Access Memories',
      author: 'Daft Punk',
      rating: 5,
      cover:
        'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
    },
  ];
}
