"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useImageCache } from "@/hooks/use-image-cache";
import type { ZhiGalleryItem, OriginalLoadState } from "../types";

export type UseGalleryImageLoadingOptions = {
    selectedItem: ZhiGalleryItem | null;
    /** Optional: load original immediately (e.g., when zoomLevel > 1) */
    shouldLoadOriginal?: boolean;
};

export type UseGalleryImageLoadingReturn = {
    displaySrc: string;
    originalState: OriginalLoadState;
    showProgress: boolean;
    cleanup: () => void;
    /** Manually trigger original image loading */
    loadOriginal: () => void;
    /** Whether original image is loaded (from cache or XHR) */
    isOriginalLoaded: boolean;
};

// Detect if we're on a mobile device
const isMobile = (): boolean => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
};

export function useGalleryImageLoading({
    selectedItem,
    shouldLoadOriginal = false,
}: UseGalleryImageLoadingOptions): UseGalleryImageLoadingReturn {
    const [displaySrc, setDisplaySrc] = useState<string>("");
    const [originalState, setOriginalState] = useState<OriginalLoadState>({
        status: "idle",
        loadedBytes: 0,
        totalBytes: null,
    });
    const [showProgress, setShowProgress] = useState(true);
    const [isOriginalLoaded, setIsOriginalLoaded] = useState(false);
    const progressHideTimerRef = useRef<number | null>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const currentItemIdRef = useRef<string | null>(null);

    // LRU cache for original images
    const imageCache = useImageCache();

    const cleanup = useCallback(() => {
        xhrRef.current?.abort();
        // Don't revoke blob URLs that are cached - the cache manages them
        objectUrlRef.current = null;
    }, []);

    // Load original image via XHR with progress, using LRU cache
    const loadOriginal = useCallback(() => {
        if (!selectedItem) return;

        // Mobile: skip original, medium is sufficient
        if (isMobile()) return;

        // Already loaded or loading
        if (isOriginalLoaded || originalState.status === "loading") return;

        const cacheKey = selectedItem.id;

        // Check cache first
        const cachedUrl = imageCache.get(cacheKey);
        if (cachedUrl) {
            setDisplaySrc(cachedUrl);
            setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
            setIsOriginalLoaded(true);
            return;
        }

        // No cache hit, fetch via XHR
        if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
            return;
        }

        // Abort any previous request
        xhrRef.current?.abort();

        const xhr = new window.XMLHttpRequest();
        xhrRef.current = xhr;
        setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });
        setShowProgress(true);

        xhr.open("GET", selectedItem.url, true);
        xhr.responseType = "blob";

        xhr.onprogress = (event) => {
            setOriginalState((prev) => ({
                status: "loading",
                loadedBytes: event.loaded,
                totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
            }));
        };

        xhr.onerror = () => {
            setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
            // Fallback to direct URL on error
            setDisplaySrc(selectedItem.url);
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
                const blob = xhr.response;
                // Store in LRU cache - cache manages blob URL lifecycle
                const blobUrl = imageCache.set(cacheKey, blob);
                objectUrlRef.current = blobUrl;
                setDisplaySrc(blobUrl);
                setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
                setIsOriginalLoaded(true);
            } else {
                setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
                setDisplaySrc(selectedItem.url);
            }
        };

        xhr.send();
    }, [selectedItem, isOriginalLoaded, originalState.status, imageCache]);

    // Initialize with medium/thumbnail when selectedItem changes
    /* eslint-disable react-hooks/set-state-in-effect -- necessary to sync state when selectedItem changes */
    useEffect(() => {
        if (!selectedItem) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on item change
            setDisplaySrc("");
            setIsOriginalLoaded(false);
            return;
        }

        // Reset state for new item
        if (currentItemIdRef.current !== selectedItem.id) {
            currentItemIdRef.current = selectedItem.id;
            xhrRef.current?.abort();
            objectUrlRef.current = null;
            setIsOriginalLoaded(false);

            // Check if original is already cached
            const cachedUrl = imageCache.get(selectedItem.id);
            if (cachedUrl) {
                setDisplaySrc(cachedUrl);
                setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
                setIsOriginalLoaded(true);
            } else {
                // Start with medium resolution
                const initialSrc = selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url;
                setDisplaySrc(initialSrc);
                setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
            }
        }
    }, [selectedItem, imageCache]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Auto-load original when shouldLoadOriginal is true (e.g., zoom > 1)
    useEffect(() => {
        if (shouldLoadOriginal && selectedItem && !isOriginalLoaded) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- loadOriginal is triggered by external state change (zoom > 1), not a render side effect
            loadOriginal();
        }
    }, [shouldLoadOriginal, selectedItem, isOriginalLoaded, loadOriginal]);

    // Auto-hide progress indicator
    useEffect(() => {
        let cancelled = false;
        if (progressHideTimerRef.current) {
            window.clearTimeout(progressHideTimerRef.current);
            progressHideTimerRef.current = null;
        }
        if (originalState.status === "loading") {
            progressHideTimerRef.current = window.setTimeout(() => {
                if (!cancelled) {
                    setShowProgress(true);
                }
            }, 0);
        }
        if (originalState.status === "success" && originalState.loadedBytes > 0) {
            progressHideTimerRef.current = window.setTimeout(() => {
                if (!cancelled) {
                    setShowProgress(false);
                }
            }, 2000);
        }
        return () => {
            cancelled = true;
            if (progressHideTimerRef.current) {
                window.clearTimeout(progressHideTimerRef.current);
            }
        };
    }, [originalState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            xhrRef.current?.abort();
            // Note: Don't revoke blob URLs - they're managed by the LRU cache
        };
    }, []);

    return {
        displaySrc,
        originalState,
        showProgress,
        cleanup,
        loadOriginal,
        isOriginalLoaded,
    };
}
