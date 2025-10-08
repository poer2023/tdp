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
        console.log(`[ImageCache] Evicted ${oldestKey}`);
      }
    }
  }, []);

  const get = useCallback((key: string): string | null => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      console.log(`[ImageCache] Cache hit for ${key}`);
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
      console.log(`[ImageCache] Cached ${key}, size: ${cacheRef.current.size}/${MAX_CACHE_SIZE}`);
      return url;
    },
    [evictLRU]
  );

  const has = useCallback((key: string): boolean => {
    return cacheRef.current.has(key);
  }, []);

  const preload = useCallback(
    async (key: string, url: string): Promise<void> => {
      if (cacheRef.current.has(key)) {
        console.log(`[ImageCache] Skip preload (already cached): ${key}`);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        set(key, blob);
      } catch (error) {
        console.error(`[ImageCache] Preload failed for ${key}:`, error);
      }
    },
    [set]
  );

  const clear = useCallback(() => {
    for (const entry of cacheRef.current.values()) {
      URL.revokeObjectURL(entry.url);
    }
    cacheRef.current.clear();
    console.log("[ImageCache] Cleared all cache");
  }, []);

  return { get, set, has, preload, clear };
}
