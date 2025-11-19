import type { BentoData } from '@/types/bento-data';

/**
 * Fallback/mock data for when APIs fail
 */
const fallbackData: BentoData = {
  mood: {
    emoji: '☕️',
    status: 'Coding',
    quote: 'Refactoring life, one component at a time...',
  },
  github: {
    totalCommits: '1.2k+',
    contributions: [
      0, 1, 2, 3, 4, 2, 3, 1, 4, 2, 3, 1, 0, 2, 4, 3, 2, 1, 3, 4, 2, 1, 3, 0,
      4, 2, 3, 1, 2, 4, 1, 3, 2, 0, 4, 3, 1, 2, 3, 4,
    ],
  },
  media: [
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
      cover: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
    },
    {
      type: 'anime',
      title: 'Frieren: Beyond Journey\'s End',
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
  ],
  steam: {
    playing: 'Elden Ring',
    hours: '142.5h',
    bg: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
    achievement: 84,
  },
  stack: {
    tags: ['React', 'Node.js', 'Python', 'Go', 'Docker', 'PostgreSQL'],
    learning: 'Rust, WebAssembly...',
  },
  health: {
    steps: 8432,
    sleep: '7h 12m',
  },
  subscriptions: {
    services: [
      { name: 'Spotify', icon: 'Music', color: 'bg-green-500' },
      { name: 'YouTube', icon: 'Youtube', color: 'bg-red-500' },
      { name: 'AWS', icon: 'Cloud', color: 'bg-orange-500' },
      { name: 'Apple', icon: 'Apple', color: 'bg-gray-800' },
      { name: 'ChatGPT', icon: 'Bot', color: 'bg-emerald-500' },
      { name: 'PlayStation', icon: 'Gamepad2', color: 'bg-blue-600' },
      { name: 'GitHub', icon: 'Github', color: 'bg-gray-900' },
      { name: 'Netflix', icon: 'Tv', color: 'bg-red-600' },
    ],
    totalPerMonth: '$142',
  },
  server: {
    cpu: 12,
    ram: 45,
    ping: 24,
    uptime: '47d 12h',
  },
};

/**
 * Fetch all Bento grid data from various sources
 * Falls back to mock data if any API fails
 */
export async function getBentoData(): Promise<BentoData> {
  try {
    // Parallel fetch all API endpoints
    const [githubRes, steamRes, mediaRes, healthRes, subsRes, serverRes] =
      await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/github`, {
          cache: 'no-store',
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/steam`, {
          cache: 'no-store',
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/media`, {
          cache: 'no-store',
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/health`, {
          cache: 'no-store',
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/subscriptions`,
          { cache: 'no-store' }
        ),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/bento/server`, {
          cache: 'no-store',
        }),
      ]);

    // Parse responses with fallback
    const github =
      githubRes.status === 'fulfilled' && githubRes.value.ok
        ? await githubRes.value.json()
        : fallbackData.github;

    const steam =
      steamRes.status === 'fulfilled' && steamRes.value.ok
        ? await steamRes.value.json()
        : fallbackData.steam;

    const media =
      mediaRes.status === 'fulfilled' && mediaRes.value.ok
        ? await mediaRes.value.json()
        : fallbackData.media;

    const health =
      healthRes.status === 'fulfilled' && healthRes.value.ok
        ? await healthRes.value.json()
        : fallbackData.health;

    const subscriptions =
      subsRes.status === 'fulfilled' && subsRes.value.ok
        ? await subsRes.value.json()
        : fallbackData.subscriptions;

    const server =
      serverRes.status === 'fulfilled' && serverRes.value.ok
        ? await serverRes.value.json()
        : fallbackData.server;

    return {
      mood: fallbackData.mood, // Static for now
      github,
      media,
      steam,
      stack: fallbackData.stack, // Static for now
      health,
      subscriptions,
      server,
    };
  } catch (error) {
    console.error('Error fetching Bento data:', error);
    return fallbackData;
  }
}

/**
 * Get fallback data (for testing/development)
 */
export function getFallbackBentoData(): BentoData {
  return fallbackData;
}
