/**
 * Bilibili Incremental Sync Implementation
 * Intelligent incremental synchronization with early stopping
 */

import type { BilibiliConfig, BilibiliHistoryItem } from "./bilibili";
import { SYNC_CONFIG, shouldDoFullSync, getIncrementalStartTimestamp } from "./sync-config";
import { getLastSuccessfulSync, getExistingExternalIds } from "./sync-state";

export interface IncrementalFetchResult {
  items: BilibiliHistoryItem[];
  syncMode: "full" | "incremental";
  pagesRequested: number;
  earlyStopTriggered: boolean;
}

/**
 * Fetch Bilibili history with intelligent incremental sync
 * @param config Bilibili authentication configuration
 * @param platform Platform name for logging
 * @returns Fetch result with sync mode and statistics
 */
export async function fetchBilibiliIncremental(
  config: BilibiliConfig,
  platform: string = "BILIBILI"
): Promise<IncrementalFetchResult> {
  // 1. Determine sync mode
  const lastSync = await getLastSuccessfulSync(platform);
  const isFullSync = shouldDoFullSync(lastSync);
  const syncMode = isFullSync ? "full" : "incremental";

  console.log(`[${platform}] Sync mode: ${syncMode}`);
  if (!isFullSync && lastSync?.lastSyncedAt) {
    console.log(`[${platform}] Last synced at: ${lastSync.lastSyncedAt.toISOString()}`);
  }

  // 2. Calculate start timestamp for incremental sync
  const startTimestamp = isFullSync ? 0 : getIncrementalStartTimestamp(lastSync?.lastSyncedAt);

  if (!isFullSync) {
    console.log(
      `[${platform}] Incremental start timestamp: ${new Date(startTimestamp * 1000).toISOString()} (with ${SYNC_CONFIG.LOOKBACK_SECONDS / 3600}h lookback)`
    );
  }

  // 3. Set max pages based on sync mode
  const maxPages = isFullSync ? SYNC_CONFIG.FULL_SYNC_MAX_PAGES : SYNC_CONFIG.INCREMENTAL_MAX_PAGES;

  console.log(`[${platform}] Max pages: ${maxPages}`);

  // 4. Fetch items with intelligent early stopping
  const allItems: BilibiliHistoryItem[] = [];
  let viewAt = 0;
  let earlyStopCount = 0;
  let earlyStopTriggered = false;
  let pagesRequested = 0;

  for (let page = 1; page <= maxPages; page++) {
    pagesRequested = page;

    try {
      // Fetch page using existing function
      const url = new URL("https://api.bilibili.com/x/web-interface/history/cursor");
      url.searchParams.set("ps", SYNC_CONFIG.BILIBILI.PAGE_SIZE.toString());
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
        console.error(`[${platform}] API error on page ${page}: ${response.status}`);
        break;
      }

      const data: {
        code: number;
        message: string;
        data: {
          cursor: { max: number; view_at: number };
          list: BilibiliHistoryItem[];
        };
      } = await response.json();

      if (data.code !== 0) {
        console.error(`[${platform}] API returned error on page ${page}: ${data.message}`);
        break;
      }

      if (!data.data?.list || data.data.list.length === 0) {
        console.log(`[${platform}] No more items at page ${page}`);
        break;
      }

      const pageItems = data.data.list;

      // Filter by timestamp for incremental sync
      const relevantItems = !isFullSync
        ? pageItems.filter((item) => item.view_at >= startTimestamp)
        : pageItems;

      if (relevantItems.length < pageItems.length) {
        console.log(
          `[${platform}] Page ${page}: ${relevantItems.length}/${pageItems.length} items within timeframe`
        );
      }

      // Add to results
      allItems.push(...relevantItems);

      // Early stop mechanism for incremental sync
      if (!isFullSync && relevantItems.length > 0) {
        // Check if all items on this page already exist in database
        const externalIds = relevantItems.map((item) => item.kid.toString());
        const existingIds = await getExistingExternalIds(platform, externalIds);

        if (existingIds.size === relevantItems.length) {
          // All items already exist
          earlyStopCount++;
          console.log(
            `[${platform}] Page ${page}: All items exist (early stop count: ${earlyStopCount}/${SYNC_CONFIG.EARLY_STOP_THRESHOLD})`
          );

          if (earlyStopCount >= SYNC_CONFIG.EARLY_STOP_THRESHOLD) {
            console.log(`[${platform}] Early stop triggered after ${page} pages`);
            earlyStopTriggered = true;
            break;
          }
        } else {
          // Reset counter if we found new items
          earlyStopCount = 0;
        }
      }

      // Update cursor for next page
      viewAt = data.data.cursor.view_at;

      // Rate limiting
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, SYNC_CONFIG.BILIBILI.RATE_LIMIT_MS));
      }
    } catch (error) {
      console.error(`[${platform}] Failed to fetch page ${page}:`, error);
      break;
    }
  }

  console.log(
    `[${platform}] Fetched ${allItems.length} items from ${pagesRequested} pages (mode: ${syncMode}${earlyStopTriggered ? ", early stop" : ""})`
  );

  return {
    items: allItems,
    syncMode,
    pagesRequested,
    earlyStopTriggered,
  };
}
