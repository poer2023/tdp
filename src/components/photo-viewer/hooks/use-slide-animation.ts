"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { SlideContext, UseSlideAnimationReturn } from "../types";
import { SLIDE_STORAGE_KEY } from "../types";

export type UseSlideAnimationOptions = {
    imageId: string;
    filePath: string;
    mediumPath?: string | null;
    title?: string | null;
    locale: "zh" | "en";
};

export function useSlideAnimation({
    imageId,
    filePath,
    mediumPath,
    title,
    locale,
}: UseSlideAnimationOptions): UseSlideAnimationReturn {
    const pendingDirectionRef = useRef<"prev" | "next" | null>(null);
    const previousSnapshotRef = useRef<{ id: string; src: string; alt: string } | null>({
        id: imageId,
        src: mediumPath || filePath,
        alt: title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
    });
    const slideTimeoutRef = useRef<number | null>(null);
    const [slideContext, setSlideContext] = useState<SlideContext | null>(null);

    const markPendingDirection = useCallback(
        (direction: "prev" | "next") => {
            pendingDirectionRef.current = direction;
            const fromSrc = mediumPath || filePath;
            const payload = {
                direction,
                ts: Date.now(),
                fromSrc,
                fromAlt: title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
                fromId: imageId,
            };
            if (typeof window !== "undefined") {
                try {
                    sessionStorage.setItem(SLIDE_STORAGE_KEY, JSON.stringify(payload));
                } catch {
                    // sessionStorage unavailable
                }
            }
        },
        [filePath, imageId, mediumPath, title, locale]
    );

    const clearStoredDirection = useCallback(() => {
        pendingDirectionRef.current = null;
        if (typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(SLIDE_STORAGE_KEY);
            } catch {
                // ignore storage errors
            }
        }
    }, []);

    const startSlide = useCallback(
        (direction: "left" | "right", from: { src: string; alt: string }) => {
            if (typeof window === "undefined") {
                setSlideContext(null);
                return;
            }
            if (slideTimeoutRef.current) {
                window.clearTimeout(slideTimeoutRef.current);
                slideTimeoutRef.current = null;
            }
            setSlideContext({ direction, fromSrc: from.src, fromAlt: from.alt, phase: "pre" });
            requestAnimationFrame(() => {
                setSlideContext((prev) => (prev ? { ...prev, phase: "animating" } : prev));
            });
            slideTimeoutRef.current = window.setTimeout(() => {
                setSlideContext(null);
                slideTimeoutRef.current = null;
            }, 320);
        },
        []
    );

    useEffect(() => {
        return () => {
            if (slideTimeoutRef.current) {
                window.clearTimeout(slideTimeoutRef.current);
                slideTimeoutRef.current = null;
            }
        };
    }, []);

    // Handle slide animation when image changes
    useEffect(() => {
        let cancelled = false;
        let rafId: number | null = null;
        const prevSnapshot = previousSnapshotRef.current;
        let pending = pendingDirectionRef.current;
        let storedSnapshot: {
            direction: "prev" | "next";
            fromSrc: string;
            fromAlt: string;
            fromId?: string;
        } | null = null;

        if (typeof window !== "undefined") {
            try {
                const stored = sessionStorage.getItem(SLIDE_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as {
                        direction?: "prev" | "next";
                        ts?: number;
                        fromSrc?: string;
                        fromAlt?: string;
                        fromId?: string;
                    };
                    if (parsed.direction && parsed.ts && Date.now() - parsed.ts < 1500) {
                        storedSnapshot = {
                            direction: parsed.direction,
                            fromSrc: parsed.fromSrc || "",
                            fromAlt: parsed.fromAlt || title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
                            fromId: parsed.fromId,
                        };
                        if (!pending) {
                            pending = parsed.direction;
                        }
                    }
                }
            } catch {
                // ignore storage errors
            }
        }

        clearStoredDirection();

        const fallbackSnapshot =
            storedSnapshot && storedSnapshot.fromSrc
                ? {
                    id: storedSnapshot.fromId || "stored",
                    src: storedSnapshot.fromSrc,
                    alt: storedSnapshot.fromAlt,
                }
                : null;

        const snapshotToUse =
            prevSnapshot && prevSnapshot.id !== imageId ? prevSnapshot : fallbackSnapshot;

        if (snapshotToUse && pending) {
            const direction = pending === "next" ? "left" : "right";
            rafId = window.requestAnimationFrame(() => {
                if (!cancelled) {
                    startSlide(direction, snapshotToUse);
                }
            });
        } else {
            queueMicrotask(() => {
                if (!cancelled) {
                    setSlideContext(null);
                }
            });
        }
        return () => {
            cancelled = true;
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [imageId, title, locale, startSlide, clearStoredDirection]);

    // Update snapshot after image change
    useEffect(() => {
        previousSnapshotRef.current = {
            id: imageId,
            src: mediumPath || filePath,
            alt: title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
        };
    }, [imageId, filePath, mediumPath, title, locale]);

    return {
        slideContext,
        startSlide,
        markPendingDirection,
        clearStoredDirection,
        pendingDirectionRef,
    };
}
