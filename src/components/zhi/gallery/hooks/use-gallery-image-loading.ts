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

        // Abort previous request
        xhrRef.current?.abort();
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        // Start with medium or thumbnail
        const initialSrc = selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url;
        setDisplaySrc(initialSrc);

        // If we have medium path, load original in background
        if (selectedItem.mediumPath && selectedItem.mediumPath !== selectedItem.url) {
            if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
                setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
                return;
            }

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
                xhr.abort();
            };
        } else {
            setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
            return undefined;
        }
    }, [selectedItem?.id, selectedItem?.url, selectedItem?.mediumPath, selectedItem?.thumbnail]);

    // Auto-hide progress indicator
    useEffect(() => {
        if (progressHideTimerRef.current) {
            window.clearTimeout(progressHideTimerRef.current);
            progressHideTimerRef.current = null;
        }
        if (originalState.status === "loading") {
            setShowProgress(true);
        }
        if (originalState.status === "success" && originalState.loadedBytes > 0) {
            progressHideTimerRef.current = window.setTimeout(() => {
                setShowProgress(false);
            }, 2000);
        }
        return () => {
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
