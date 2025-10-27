/**
 * Incremental Sync Configuration
 * Constants and helper functions for intelligent incremental synchronization
 */

export const SYNC_CONFIG = {
  // Lookback window to prevent missing data due to timestamp precision issues
  LOOKBACK_SECONDS: 3600, // 1 hour

  // Early stop mechanism - stop if N consecutive pages have no new data
  EARLY_STOP_THRESHOLD: 3,

  // Full sync interval - perform full sync every N days to ensure data completeness
  FULL_SYNC_INTERVAL_DAYS: 7,

  // Max pages for incremental vs full sync
  INCREMENTAL_MAX_PAGES: 10, // Usually 1-3 pages for daily updates
  FULL_SYNC_MAX_PAGES: 50, // Complete history

  // Platform-specific settings
  BILIBILI: {
    PAGE_SIZE: 20,
    RATE_LIMIT_MS: 1000, // 1 second between requests
  },
  DOUBAN: {
    PAGE_SIZE: 15,
    RATE_LIMIT_MS: 1000,
  },
} as const;

export type SyncMode = "full" | "incremental";

export interface LastSyncInfo {
  lastCursor?: string;
  lastSyncedAt?: Date;
  completedAt?: Date;
  syncMode?: SyncMode;
}

/**
 * Determine if a full sync should be performed
 * @param lastSync Information from the last successful sync
 * @returns true if full sync is needed
 */
export function shouldDoFullSync(lastSync: LastSyncInfo | null): boolean {
  if (!lastSync || !lastSync.completedAt) {
    // No previous sync, do full sync
    return true;
  }

  const daysSinceLastFullSync =
    lastSync.syncMode === "full"
      ? (Date.now() - lastSync.completedAt.getTime()) / (1000 * 60 * 60 * 24)
      : SYNC_CONFIG.FULL_SYNC_INTERVAL_DAYS + 1; // Force full sync if last was incremental

  return daysSinceLastFullSync >= SYNC_CONFIG.FULL_SYNC_INTERVAL_DAYS;
}

/**
 * Calculate the start timestamp for incremental sync with lookback window
 * @param lastSyncedAt Timestamp of last synced item
 * @returns Unix timestamp (seconds) to start fetching from
 */
export function getIncrementalStartTimestamp(lastSyncedAt: Date | undefined): number {
  if (!lastSyncedAt) {
    return 0; // No previous sync, fetch all
  }

  const lastSyncSeconds = Math.floor(lastSyncedAt.getTime() / 1000);
  return lastSyncSeconds - SYNC_CONFIG.LOOKBACK_SECONDS;
}
