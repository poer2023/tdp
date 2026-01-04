"use client";

import { useCallback, useRef } from "react";

interface CacheEntry {
  blob: Blob;
  url: string;
  lastAccessed: number;
}

const MAX_CACHE_SIZE = 8;

export function useImageCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const evictLRU = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size < MAX_CACHE_SIZE) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = cache.get(oldestKey);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        cache.delete(oldestKey);

      }
    }
  }, []);

  const get = useCallback((key: string): string | null => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();

      return entry.url;
    }
    return null;
  }, []);

  const set = useCallback(
    (key: string, blob: Blob): string => {
      evictLRU();
      const url = URL.createObjectURL(blob);
      cacheRef.current.set(key, {
        blob,
        url,
        lastAccessed: Date.now(),
      });

      return url;
    },
    [evictLRU]
  );

  const has = useCallback((key: string): boolean => {
    return cacheRef.current.has(key);
  }, []);

  const preload = useCallback(
    async (key: string, url: string): Promise<void> => {
      // Skip invalid URLs
      if (!url || url.startsWith("blob:") || url.startsWith("data:")) {

        return;
      }

      if (cacheRef.current.has(key)) {

        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          // Silently skip non-existent images

          return;
        }
        const blob = await response.blob();
        set(key, blob);
      } catch {
        // Silently handle fetch errors (e.g., network issues, invalid URLs)

      }
    },
    [set]
  );

  const clear = useCallback(() => {
    for (const entry of cacheRef.current.values()) {
      URL.revokeObjectURL(entry.url);
    }
    cacheRef.current.clear();

  }, []);

  return { get, set, has, preload, clear };
}
