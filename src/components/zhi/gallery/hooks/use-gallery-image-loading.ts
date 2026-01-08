"use client";

import { useState, useEffect, useRef } from "react";
import type { ZhiGalleryItem, OriginalLoadState } from "../types";

export type UseGalleryImageLoadingOptions = {
    selectedItem: ZhiGalleryItem | null;
};

export type UseGalleryImageLoadingReturn = {
    displaySrc: string;
    originalState: OriginalLoadState;
    showProgress: boolean;
    cleanup: () => void;
};

export function useGalleryImageLoading({
    selectedItem,
}: UseGalleryImageLoadingOptions): UseGalleryImageLoadingReturn {
    const [displaySrc, setDisplaySrc] = useState<string>("");
    const [originalState, setOriginalState] = useState<OriginalLoadState>({
        status: "idle",
        loadedBytes: 0,
        totalBytes: null,
    });
    const [showProgress, setShowProgress] = useState(true);
    const progressHideTimerRef = useRef<number | null>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const lastProgressUpdateRef = useRef<number>(0);
    const PROGRESS_THROTTLE_MS = 100; // Throttle progress updates to avoid main thread blocking

    const cleanup = () => {
        xhrRef.current?.abort();
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    };

    // Load original image with progress
    useEffect(() => {
        if (!selectedItem) return;
        let cancelled = false;
        const schedule = (fn: () => void) => {
            queueMicrotask(() => {
                if (!cancelled) {
                    fn();
                }
            });
        };

        // Abort previous request
        xhrRef.current?.abort();
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        // Start with medium or thumbnail
        const initialSrc = selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url;
        schedule(() => {
            setDisplaySrc(initialSrc);
        });

        // If we have medium path, load original in background
        if (selectedItem.mediumPath && selectedItem.mediumPath !== selectedItem.url) {
            if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
                schedule(() => {
                    setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
                });
                return () => {
                    cancelled = true;
                };
            }

            const xhr = new window.XMLHttpRequest();
            xhrRef.current = xhr;
            schedule(() => {
                setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });
                setShowProgress(true);
            });

            xhr.open("GET", selectedItem.url, true);
            xhr.responseType = "blob";

            xhr.onprogress = (event) => {
                // Throttle progress updates to reduce main thread blocking
                const now = Date.now();
                if (now - lastProgressUpdateRef.current < PROGRESS_THROTTLE_MS) return;
                lastProgressUpdateRef.current = now;

                setOriginalState((prev) => ({
                    status: "loading",
                    loadedBytes: event.loaded,
                    totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
                }));
            };

            xhr.onerror = () => {
                // CORS or network error - gracefully fallback to direct URL
                // The <img> tag can load the image without CORS restrictions
                setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
                setDisplaySrc(selectedItem.url);
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
                    const blob = xhr.response;
                    const url = URL.createObjectURL(blob);
                    objectUrlRef.current = url;
                    setDisplaySrc(url);
                    setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
                } else {
                    setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
                    setDisplaySrc(selectedItem.url);
                }
            };

            xhr.send();

            return () => {
                cancelled = true;
                xhr.abort();
            };
        } else {
            schedule(() => {
                setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
            });
            return () => {
                cancelled = true;
            };
        }
    }, [selectedItem]);

    // Auto-hide progress indicator
    // Use setTimeout in callback instead of synchronous setState in effect
    useEffect(() => {
        let cancelled = false;
        if (progressHideTimerRef.current) {
            window.clearTimeout(progressHideTimerRef.current);
            progressHideTimerRef.current = null;
        }
        if (originalState.status === "loading") {
            // Schedule state update via setTimeout (async, not synchronous)
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
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    return {
        displaySrc,
        originalState,
        showProgress,
        cleanup,
    };
}
