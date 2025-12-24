"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

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
 * Short-circuits for anonymous users to avoid unnecessary network requests.
 */
export function useMomentLikes(momentIds: string[]) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated" && !!session?.user;

    // Always start with empty set to match SSR (avoids hydration mismatch)
    const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
    const [isHydrated, setIsHydrated] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
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
        setIsHydrated(true);
    }, []);

    // Fetch like states from API
    const fetchLikeStates = useCallback(async (ids: string[]) => {
        if (ids.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/moments/likes?ids=${ids.join(",")}`);
            if (!res.ok) throw new Error("Failed to fetch like states");

            const data = await res.json();
            const newLikedIds = new Set<string>(data.likedIds || []);

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
        } catch (error) {
            console.debug("[useMomentLikes] Failed to fetch:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on mount (only once, only for authenticated users)
    useEffect(() => {
        // Short-circuit for anonymous users - no need to fetch likes
        if (status === "loading") return; // Wait for session to load
        if (!isAuthenticated) {
            setIsLoading(false);
            // Clear cache for logged-out users
            if (typeof window !== "undefined") {
                try {
                    localStorage.removeItem(CACHE_KEY);
                } catch { /* ignore */ }
            }
            setLikedIds(new Set());
            return;
        }

        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchLikeStates(momentIds);
    }, [momentIds, fetchLikeStates, isAuthenticated, status]);

    // Optimistic like toggle
    const toggleLike = useCallback((momentId: string, newLikedState: boolean) => {
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
    }, []);

    // Check if a moment is liked
    const isLiked = useCallback((momentId: string) => likedIds.has(momentId), [likedIds]);

    return {
        likedIds,
        isLiked,
        isLoading,
        toggleLike,
        refetch: () => isAuthenticated && fetchLikeStates(momentIds),
    };
}

export default useMomentLikes;

