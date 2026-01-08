"use client";

import { useEffect, useState, useRef } from "react";
import { useImageCache } from "@/hooks/use-image-cache";
import type { OriginalLoadState, UseImageLoadingReturn } from "../types";

export type UseImageLoadingOptions = {
    imageId: string;
    filePath: string;
    mediumPath?: string | null;
};

export function useImageLoading({
    imageId,
    filePath,
    mediumPath,
}: UseImageLoadingOptions): UseImageLoadingReturn {
    const imageCache = useImageCache();
    const [displaySrc, setDisplaySrc] = useState<string>(mediumPath || filePath);
    const [originalState, setOriginalState] = useState<OriginalLoadState>({
        status: "idle",
        loadedBytes: 0,
        totalBytes: null,
    });
    const [showProgress, setShowProgress] = useState(true);
    const progressHideTimerRef = useRef<number | null>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    // Auto-hide progress indicator when 100%
    useEffect(() => {
        let cancelled = false;
        if (progressHideTimerRef.current) {
            window.clearTimeout(progressHideTimerRef.current);
            progressHideTimerRef.current = null;
        }

        if (originalState.status === "loading") {
            queueMicrotask(() => {
                if (!cancelled) {
                    setShowProgress(true);
                }
            });
        }

        if (
            originalState.status === "success" &&
            originalState.loadedBytes > 0 &&
            originalState.totalBytes &&
            originalState.loadedBytes >= originalState.totalBytes
        ) {
            progressHideTimerRef.current = window.setTimeout(() => {
                if (!cancelled) {
                    setShowProgress(false);
                }
                progressHideTimerRef.current = null;
            }, 2000);
        }

        return () => {
            cancelled = true;
            if (progressHideTimerRef.current) {
                window.clearTimeout(progressHideTimerRef.current);
                progressHideTimerRef.current = null;
            }
        };
    }, [originalState]);

    // Cleanup download artefacts on unmount
    useEffect(() => {
        return () => {
            xhrRef.current?.abort();
            xhrRef.current = null;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, []);

    // Fetch original image with progress (with caching)
    useEffect(() => {
        let cancelled = false;
        const schedule = (fn: () => void) => {
            queueMicrotask(() => {
                if (!cancelled) {
                    fn();
                }
            });
        };

        xhrRef.current?.abort();
        xhrRef.current = null;
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        const hasMedium = Boolean(mediumPath && mediumPath !== filePath);

        // No mediumPath or already using full resolution
        if (!hasMedium) {
            schedule(() => {
                setDisplaySrc(filePath);
                setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
            });
            return () => {
                cancelled = true;
            };
        }

        // Check cache first
        const cachedUrl = imageCache.get(imageId);
        if (cachedUrl) {
            schedule(() => {
                setDisplaySrc(cachedUrl);
                setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
            });
            return () => {
                cancelled = true;
            };
        }

        // Reset display src to medium on image change
        schedule(() => {
            setDisplaySrc(mediumPath || filePath);
        });

        // SSR guard
        if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
            schedule(() => {
                setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
            });
            return () => {
                cancelled = true;
            };
        }

        // Start loading original image
        const xhr = new window.XMLHttpRequest();
        xhrRef.current = xhr;
        schedule(() => {
            setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });
        });

        xhr.open("GET", filePath, true);
        xhr.responseType = "blob";

        xhr.onprogress = (event) => {
            setOriginalState((prev) => ({
                status: "loading",
                loadedBytes: event.loaded,
                totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
            }));
        };

        const handleFailure = () => {
            if (xhrRef.current === xhr) {
                xhrRef.current = null;
            }
            setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
            setDisplaySrc(filePath);
        };

        xhr.onerror = handleFailure;
        xhr.onabort = () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            if (xhrRef.current === xhr) {
                xhrRef.current = null;
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
                const blob = xhr.response as Blob;
                const url = imageCache.set(imageId, blob);
                setDisplaySrc(url);
                setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
                if (xhrRef.current === xhr) {
                    xhrRef.current = null;
                }
            } else {
                handleFailure();
            }
        };

        try {
            xhr.send();
        } catch {
            handleFailure();
        }

        return () => {
            cancelled = true;
            xhr.abort();
            if (xhrRef.current === xhr) {
                xhrRef.current = null;
            }
        };
    }, [imageId, filePath, mediumPath, imageCache]);

    return {
        displaySrc,
        setDisplaySrc,
        originalState,
        showProgress,
    };
}
