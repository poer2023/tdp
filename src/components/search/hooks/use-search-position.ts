"use client";

import { useEffect, useState, useCallback } from "react";
import type { SearchAnchor, UseSearchPositionReturn } from "../types";

export function useSearchPosition(
    open: boolean,
    rootRef: React.RefObject<HTMLDivElement | null>
): UseSearchPositionReturn {
    const [anchor, setAnchor] = useState<SearchAnchor | null>(null);

    const computePosition = useCallback(() => {
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 8; // viewport safety margin
        const right = Math.max(margin, vw - rect.right);
        const available = vw - right - margin; // distance from right to left margin
        const width = Math.max(220, Math.min(available, 480));
        const top = Math.max(margin, rect.top + rect.height / 2);
        const inputHeight = 40; // approx
        const maxHeight = Math.max(160, Math.min(320, vh - top - inputHeight - margin));
        setAnchor({ right, top, width, maxHeight });
    }, [rootRef]);

    useEffect(() => {
        if (!open) return;
        computePosition();
        const onResize = () => computePosition();
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, { passive: true });
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onResize);
        };
    }, [open, computePosition]);

    return { anchor };
}
