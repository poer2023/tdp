"use client";

import { useCallback } from "react";

interface CacheEntry {
  blob: Blob;
  url: string;
  lastAccessed: number;
}

const MAX_CACHE_SIZE = 8;

// Global singleton cache - persists across component remounts during navigation
const globalCache = new Map<string, CacheEntry>();

function evictLRU() {
  if (globalCache.size < MAX_CACHE_SIZE) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of globalCache.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    const entry = globalCache.get(oldestKey);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      globalCache.delete(oldestKey);
    }
  }
}

export function useImageCache() {
  const get = useCallback((key: string): string | null => {
    const entry = globalCache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.url;
    }
    return null;
  }, []);

  const set = useCallback((key: string, blob: Blob): string => {
    // Check if already cached (avoid duplicate blob URLs)
    const existing = globalCache.get(key);
    if (existing) {
      existing.lastAccessed = Date.now();
      return existing.url;
    }

    evictLRU();
    const url = URL.createObjectURL(blob);
    globalCache.set(key, {
      blob,
      url,
      lastAccessed: Date.now(),
    });
    return url;
  }, []);

  const has = useCallback((key: string): boolean => {
    return globalCache.has(key);
  }, []);

  const preload = useCallback(
    async (key: string, url: string): Promise<void> => {
      // Skip invalid URLs
      if (!url || url.startsWith("blob:") || url.startsWith("data:")) {
        return;
      }

      if (globalCache.has(key)) {
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const blob = await response.blob();
        set(key, blob);
      } catch {
        // Silently handle fetch errors
      }
    },
    [set]
  );

  const clear = useCallback(() => {
    for (const entry of globalCache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    globalCache.clear();
  }, []);

  return { get, set, has, preload, clear };
}
