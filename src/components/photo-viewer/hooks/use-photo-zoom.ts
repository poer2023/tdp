"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Offset, Size, UsePhotoZoomReturn } from "../types";

export function usePhotoZoom(): UsePhotoZoomReturn {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
    const [showHint, setShowHint] = useState(true);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);
    const zoomHideTimerRef = useRef<number | null>(null);
    const [containerSize, setContainerSize] = useState<Size>({ w: 0, h: 0 });
    const [naturalSize, setNaturalSize] = useState<Size | null>(null);
    const imgWrapRef = useRef<HTMLDivElement | null>(null);
    const scaleRef = useRef(scale);
    const offsetRef = useRef(offset);
    const clampOffsetRef = useRef<
        ((nextOffset: Offset, s: number) => Offset) | null
    >(null);

    // Auto-hide zoom indicator when scale is 100%
    useEffect(() => {
        if (zoomHideTimerRef.current) {
            window.clearTimeout(zoomHideTimerRef.current);
            zoomHideTimerRef.current = null;
        }

        setShowZoomIndicator(true);

        if (scale === 1) {
            zoomHideTimerRef.current = window.setTimeout(() => {
                setShowZoomIndicator(false);
                zoomHideTimerRef.current = null;
            }, 2000);
        }

        return () => {
            if (zoomHideTimerRef.current) {
                window.clearTimeout(zoomHideTimerRef.current);
                zoomHideTimerRef.current = null;
            }
        };
    }, [scale]);

    // Helper: clamp offset so image stays within bounds based on scale
    const clampOffset = useCallback(
        function clampOffset(
            nextOffset: Offset,
            s: number
        ): Offset {
            const cw = containerSize.w;
            const ch = containerSize.h;
            if (!cw || !ch) return { x: 0, y: 0 };
            // Compute contained image base size
            let w0 = cw;
            let h0 = ch;
            if (naturalSize && naturalSize.w > 0 && naturalSize.h > 0) {
                const a = naturalSize.w / naturalSize.h;
                if (cw / ch < a) {
                    w0 = cw;
                    h0 = cw / a;
                } else {
                    h0 = ch;
                    w0 = ch * a;
                }
            }
            const w = w0 * s;
            const h = h0 * s;
            const maxX = Math.max(0, (w - cw) / 2);
            const maxY = Math.max(0, (h - ch) / 2);
            return {
                x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
                y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
            };
        },
        [containerSize, naturalSize]
    );

    useEffect(() => {
        clampOffsetRef.current = clampOffset;
    }, [clampOffset]);

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        offsetRef.current = offset;
    }, [offset]);

    // Observe container size
    useEffect(() => {
        const el = imgWrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect;
                setContainerSize((prev) => {
                    if (prev.w === cr.width && prev.h === cr.height) return prev;
                    return { w: cr.width, h: cr.height };
                });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Wheel zoom (center-based)
    useEffect(() => {
        const el = imgWrapRef.current;
        if (!el) return;
        const onWheel = (e: Event) => {
            const we = e as WheelEvent;
            we.preventDefault();
            setShowHint(false);
            const delta = -we.deltaY;
            const factor = delta > 0 ? 1.1 : 0.9;
            setScale((prev) => {
                const next = Math.max(1, Math.min(4, prev * factor));
                const clampFn = clampOffsetRef.current;
                if (clampFn) {
                    setOffset((off) => clampFn(off, next));
                }
                return next;
            });
        };
        el.addEventListener("wheel", onWheel as EventListener, { passive: false });
        return () => el.removeEventListener("wheel", onWheel as EventListener);
    }, []);

    // Double-click toggle zoom
    useEffect(() => {
        const el = imgWrapRef.current;
        if (!el) return;
        const onDbl = (e: MouseEvent) => {
            e.preventDefault();
            setScale((s) => {
                const next = s > 1 ? 1 : 2;
                const clampFn = clampOffsetRef.current;
                if (clampFn) {
                    setOffset((off) => clampFn(off, next));
                }
                return next;
            });
            setShowHint(false);
        };
        el.addEventListener("dblclick", onDbl);
        return () => el.removeEventListener("dblclick", onDbl);
    }, []);

    // Pinch zoom for touch devices
    useEffect(() => {
        const el = imgWrapRef.current;
        if (!el) return;
        let startDist = 0;
        let startScale = 1;
        const dist = (t1: Touch, t2: Touch) => {
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            return Math.hypot(dx, dy);
        };
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const t1 = e.touches[0]!;
                const t2 = e.touches[1]!;
                startDist = dist(t1, t2);
                startScale = scaleRef.current;
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const t1 = e.touches[0]!;
                const t2 = e.touches[1]!;
                const d = dist(t1, t2);
                const ratio = d / (startDist || d);
                const next = Math.max(1, Math.min(4, startScale * ratio));
                setScale(next);
                const clampFn = clampOffsetRef.current;
                if (clampFn) {
                    setOffset((off) => clampFn(off, next));
                }
            }
        };
        el.addEventListener("touchstart", onTouchStart, { passive: false });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
        };
    }, []);

    return {
        scale,
        setScale,
        offset,
        setOffset,
        showZoomIndicator,
        showHint,
        setShowHint,
        clampOffset,
        containerSize,
        naturalSize,
        setNaturalSize,
        imgWrapRef,
    };
}
