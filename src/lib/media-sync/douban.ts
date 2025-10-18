/**
 * Douban Watch History Sync
 * Fetches user's marked movies/TV shows from Douban
 */

import * as cheerio from "cheerio";

export interface DoubanConfig {
  userId: string; // Douban user ID
  cookie?: string; // Optional cookie for private data
}

export interface DoubanWatchedItem {
  id: string;
  title: string;
  cover: string;
  rating: number; // User's rating (1-5)
  watchedAt: string; // Date string like "2024-10-15"
  type: "movie" | "series";
  url: string;
  year?: string;
  directors?: string[];
}

/**
 * Fetch Douban watched movies/shows using HTML parsing
 * @param config User's Douban configuration
 * @param maxPages Maximum number of pages to fetch (default: 5, each page has ~15 items)
 */
export async function fetchDoubanWatched(
  config: DoubanConfig,
  maxPages: number = 5
): Promise<DoubanWatchedItem[]> {
  const allItems: DoubanWatchedItem[] = [];

  for (let page = 0; page < maxPages; page++) {
    try {
      const start = page * 15; // Douban shows 15 items per page
      const url = `https://movie.douban.com/people/${config.userId}/collect?start=${start}&sort=time&rating=all&filter=all&mode=grid`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: config.cookie || "",
          Referer: "https://movie.douban.com",
        },
      });

      if (!response.ok) {
        throw new Error(`Douban request failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageItems: DoubanWatchedItem[] = [];

      $(".item").each((_, element) => {
        try {
          const $item = $(element);

          // Extract ID from the link
          const href = $item.find(".pic a").attr("href") || "";
          const idMatch = href.match(/subject\/(\d+)/);
          if (!idMatch) return;

          const id = idMatch[1];
          if (!id) {
            return;
          }
          const title = $item.find(".title em").text().trim();
          const cover = $item.find(".pic img").attr("src") || "";

          // Extract rating (e.g., "rating5-t" means 5 stars)
          const ratingClass = $item.find(".rating").attr("class") || "";
          const ratingMatch = ratingClass.match(/rating(\d)-t/);
          const rating = ratingMatch ? parseInt(ratingMatch[1] ?? "0", 10) : 0;

          // Extract watch date
          const dateText = $item.find(".date").text().trim();

          // Determine type (movie or series)
          // Douban doesn't explicitly mark this in the list, so we'll default to movie
          // and can enhance this later by fetching individual item details
          const type = "movie" as const;

          // Extract additional info from the intro
          const intro = $item.find(".intro").text().trim();
          const yearMatch = intro.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : undefined;

          pageItems.push({
            id,
            title,
            cover,
            rating,
            watchedAt: parseDoubanDate(dateText),
            type,
            url: `https://movie.douban.com/subject/${id}/`,
            year,
          });
        } catch (error) {
          console.error("[Douban] Failed to parse item:", error);
        }
      });

      if (pageItems.length === 0) {
        // No more items on this page
        break;
      }

      allItems.push(...pageItems);

      // Rate limiting: wait 2 seconds between requests to avoid blocking
      if (page < maxPages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[Douban] Failed to fetch page ${page}:`, error);
      // Continue with what we have so far
      break;
    }
  }

  return allItems;
}

/**
 * Parse Douban date format to ISO date string
 * Examples: "2024-10-15", "10-15", "今天", "昨天"
 */
function parseDoubanDate(dateText: string): string {
  const now = new Date();

  // Handle "今天" (today)
  if (dateText === "今天") {
    const [today] = now.toISOString().split("T");
    return today ?? now.toISOString();
  }

  // Handle "昨天" (yesterday)
  if (dateText === "昨天") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const [isoYesterday] = yesterday.toISOString().split("T");
    return isoYesterday ?? yesterday.toISOString();
  }

  // Handle "MM-DD" format (assume current year)
  if (/^\d{2}-\d{2}$/.test(dateText)) {
    const year = now.getFullYear();
    return `${year}-${dateText}`;
  }

  // Handle "YYYY-MM-DD" format (already in ISO format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return dateText;
  }

  // Fallback to today
  const [fallback] = now.toISOString().split("T");
  return fallback ?? now.toISOString();
}

/**
 * Normalize Douban items to our internal format
 */
export function normalizeDoubanItem(item: DoubanWatchedItem) {
  return {
    platform: "douban" as const,
    externalId: item.id,
    type: item.type,
    title: item.title,
    cover: item.cover,
    url: item.url,
    watchedAt: new Date(item.watchedAt),
    rating: item.rating,
    metadata: {
      year: item.year,
      directors: item.directors,
    },
  };
}
