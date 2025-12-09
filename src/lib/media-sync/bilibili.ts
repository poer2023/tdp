/**
 * Bilibili Watch History Sync
 * Fetches user's watch history from Bilibili API using cookies
 */

export interface BilibiliConfig {
  sessdata: string;
  biliJct: string;
  buvid3: string;
}

export interface BilibiliHistoryItem {
  title: string;
  cover: string; // Cover image
  view_at: number; // Unix timestamp
  progress: number; // Watch progress in seconds (-1 means not recorded)
  duration: number; // Total duration in seconds
  videos: number; // Number of parts (for multi-part videos)
  author_name: string;
  author_mid: number;
  history: {
    oid: number;
    bvid: string;
    page: number;
    cid: number;
  };
  kid: number; // Unique ID
}

interface BilibiliApiResponse {
  code: number;
  message: string;
  data: {
    cursor: {
      max: number;
      view_at: number;
    };
    list: BilibiliHistoryItem[];
  };
}

/**
 * Fetch Bilibili watch history
 * @param config User's Bilibili authentication cookies
 * @param maxPages Maximum number of pages to fetch (default: 50, each page has ~20 items = ~1000 total items)
 */
export async function fetchBilibiliHistory(
  config: BilibiliConfig,
  maxPages: number = 50
): Promise<BilibiliHistoryItem[]> {
  const allItems: BilibiliHistoryItem[] = [];
  let viewAt = 0; // Pagination cursor

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = new URL("https://api.bilibili.com/x/web-interface/history/cursor");
      url.searchParams.set("ps", "20"); // Page size
      if (viewAt > 0) {
        url.searchParams.set("view_at", viewAt.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          Cookie: `SESSDATA=${config.sessdata}; bili_jct=${config.biliJct}; buvid3=${config.buvid3}`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.bilibili.com",
        },
      });

      if (!response.ok) {
        throw new Error(`Bilibili API error: ${response.status} ${response.statusText}`);
      }

      const data: BilibiliApiResponse = await response.json();

      if (data.code !== 0) {
        throw new Error(`Bilibili API returned error: ${data.code} - ${data.message}`);
      }

      if (!data.data?.list || data.data.list.length === 0) {
        // No more items
        break;
      }

      allItems.push(...data.data.list);
      viewAt = data.data.cursor.view_at;

      // Rate limiting: wait 1 second between requests
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[Bilibili] Failed to fetch page ${page}:`, error);
      // Continue with what we have so far
      break;
    }
  }

  return allItems;
}

/**
 * Normalize Bilibili history items to our internal format
 */
export function normalizeBilibiliItem(item: BilibiliHistoryItem) {
  // Calculate progress percentage (progress -1 means not recorded)
  const progressPercent =
    item.duration > 0 && item.progress > 0 ? Math.round((item.progress / item.duration) * 100) : 0;

  // Better type detection:
  // - Check if it's part of a series/collection based on videos count
  // - Most Bilibili content with videos=1 is actually single video content
  // - Only mark as "series" if it has multiple parts (videos > 1)
  const contentType = item.videos && item.videos > 1 ? "series" : "video";

  // Ensure we have valid timestamps
  // view_at is the Unix timestamp when the video was watched
  const watchedAtTimestamp = item.view_at * 1000; // Convert to milliseconds
  const watchedDate = new Date(watchedAtTimestamp);

  // Validate the date is reasonable (not in future, not too far in past)
  const now = Date.now();
  const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60 * 1000);
  const isValidDate = watchedAtTimestamp > tenYearsAgo && watchedAtTimestamp <= now;

  return {
    platform: "BILIBILI" as const,
    externalId: item.history?.bvid || item.kid.toString(), // Prefer bvid, fallback to kid
    type: contentType,
    title: item.title,
    cover: item.cover,
    url: `https://www.bilibili.com/video/${item.history.bvid}`,
    watchedAt: isValidDate ? watchedDate : new Date(), // Use current time if invalid
    progress: Math.min(progressPercent, 100),
    duration: Math.round(item.duration / 60), // Convert to minutes
    rating: null, // Bilibili doesn't provide ratings in history
    season: item.videos > 1 ? 1 : null, // Mark as season 1 if multi-part
    episode: item.history?.page || null, // Which part/episode was watched
    metadata: {
      author: item.author_name,
      authorMid: item.author_mid,
      bvid: item.history.bvid,
      oid: item.history.oid,
      cid: item.history.cid,
      videos: item.videos, // Total number of parts
      page: item.history.page, // Current part number
      kid: item.kid, // Bilibili's unique history ID
      viewAtRaw: item.view_at, // Store raw timestamp for debugging
      progressSeconds: item.progress, // Raw progress in seconds
      durationSeconds: item.duration, // Raw duration in seconds
    },
  };
}
