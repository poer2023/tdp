"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CACHE_KEY = "moment_likes_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheData {
    likedIds: string[];
    timestamp: number;
}

/**
 * Hook to fetch and cache moment like states for the current user.
 * Uses localStorage to avoid flicker on page load and provides
 * optimistic updates when toggling likes.
 * No longer depends on SessionProvider - uses API responses to detect auth state.
 */
export function useMomentLikes(momentIds: string[]) {
    const router = useRouter();

    // Always start with empty set to match SSR (avoids hydration mismatch)
    const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const fetchedRef = useRef(false);

    // Hydrate from localStorage AFTER mount to avoid hydration mismatch
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const data: CacheData = JSON.parse(cached);
                // Check if cache is still valid
                if (Date.now() - data.timestamp < CACHE_TTL) {
                    setLikedIds(new Set(data.likedIds));
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Fetch like states from API
    const fetchLikeStates = useCallback(async (ids: string[]) => {
        if (ids.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/moments/likes?ids=${ids.join(",")}`);

            // 401/403 means not authenticated
            if (res.status === 401 || res.status === 403) {
                setIsAuthenticated(false);
                setLikedIds(new Set());
                setIsLoading(false);
                // Clear cache for logged-out users
                try {
                    localStorage.removeItem(CACHE_KEY);
                } catch { /* ignore */ }
                return;
            }

            if (!res.ok) throw new Error("Failed to fetch like states");

            const data = await res.json();
            const newLikedIds = new Set<string>(data.likedIds || []);

            setIsAuthenticated(true);
            setLikedIds(newLikedIds);

            // Update localStorage cache
            try {
                const cacheData: CacheData = {
                    likedIds: Array.from(newLikedIds),
                    timestamp: Date.now(),
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            } catch {
                // Ignore storage errors
            }
        } catch {
            // Network error - assume not authenticated for safety
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on mount (only once)
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchLikeStates(momentIds);
    }, [momentIds, fetchLikeStates]);

    // Optimistic like toggle - redirects to login if not authenticated
    const toggleLike = useCallback(async (momentId: string, newLikedState: boolean) => {
        // If we know we're not authenticated, redirect to login
        if (isAuthenticated === false) {
            router.push("/login");
            return;
        }

        // Optimistic update
        setLikedIds((prev) => {
            const next = new Set(prev);
            if (newLikedState) {
                next.add(momentId);
            } else {
                next.delete(momentId);
            }

            // Update localStorage cache
            try {
                const cacheData: CacheData = {
                    likedIds: Array.from(next),
                    timestamp: Date.now(),
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            } catch {
                // Ignore storage errors
            }

            return next;
        });
    }, [isAuthenticated, router]);

    // Check if a moment is liked
    const isLiked = useCallback((momentId: string) => likedIds.has(momentId), [likedIds]);

    return {
        likedIds,
        isLiked,
        isLoading,
        isAuthenticated,
        toggleLike,
        refetch: () => fetchLikeStates(momentIds),
    };
}

export default useMomentLikes;
