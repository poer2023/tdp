"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { DragState, Offset, UsePhotoDragReturn } from "../types";

export type UsePhotoDragOptions = {
    scaleRef: React.MutableRefObject<number>;
    offsetRef: React.MutableRefObject<Offset>;
    clampOffsetRef: React.MutableRefObject<((nextOffset: Offset, s: number) => Offset) | null>;
    imgWrapRef: React.RefObject<HTMLDivElement | null>;
    setOffset: React.Dispatch<React.SetStateAction<Offset>>;
    setShowHint: (v: boolean) => void;
    onSwipe?: (direction: "prev" | "next") => void;
};

const SWIPE_THRESHOLD = 100;

export function usePhotoDrag({
    scaleRef,
    offsetRef,
    clampOffsetRef,
    imgWrapRef,
    setOffset,
    setShowHint,
    onSwipe,
}: UsePhotoDragOptions): UsePhotoDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<DragState>({
        active: false,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
    });

    const preventDefault = useCallback((event: Event) => {
        event.preventDefault();
    }, []);

    useEffect(() => {
        const el = imgWrapRef.current;
        if (!el) return;

        const onDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();
            const currentOffset = offsetRef.current;
            dragRef.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                originX: currentOffset.x,
                originY: currentOffset.y,
            };
            setIsDragging(true);
            setShowHint(false);
        };

        const onMove = (e: MouseEvent) => {
            if (!dragRef.current.active) return;

            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            const currentScale = scaleRef.current;

            if (currentScale > 1) {
                // Zoomed: pan the image
                const next = { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy };
                const clampFn = clampOffsetRef.current;
                setOffset((prev) => {
                    const clamped = clampFn ? clampFn(next, currentScale) : next;
                    if (prev.x === clamped.x && prev.y === clamped.y) {
                        return prev;
                    }
                    return clamped;
                });
            } else {
                // Not zoomed: horizontal swipe for navigation
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (absDx > absDy && absDx > 10) {
                    setOffset((prev) => {
                        const nextOffset = { x: dx * 0.3, y: 0 };
                        if (prev.x === nextOffset.x && prev.y === nextOffset.y) {
                            return prev;
                        }
                        return nextOffset;
                    });
                }
            }
        };

        const end = (e: MouseEvent) => {
            if (!dragRef.current.active) return;
            const currentScale = scaleRef.current;
            const dragDistance = e.clientX - dragRef.current.startX;

            if (currentScale === 1 && Math.abs(dragDistance) > SWIPE_THRESHOLD && onSwipe) {
                if (dragDistance < 0) {
                    onSwipe("next");
                } else {
                    onSwipe("prev");
                }
            }

            if (currentScale === 1) {
                setOffset((prev) => {
                    if (prev.x === 0 && prev.y === 0) {
                        return prev;
                    }
                    return { x: 0, y: 0 };
                });
            }

            dragRef.current.active = false;
            setIsDragging(false);
        };

        el.addEventListener("mousedown", onDown);
        el.addEventListener("dragstart", preventDefault);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", end);

        return () => {
            el.removeEventListener("mousedown", onDown);
            el.removeEventListener("dragstart", preventDefault);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", end);
        };
    }, [imgWrapRef, offsetRef, scaleRef, clampOffsetRef, setOffset, setShowHint, onSwipe, preventDefault]);

    return {
        isDragging,
        dragRef,
    };
}
