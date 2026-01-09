"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BlockLoaderProps {
    /** Primary color for blocks (any valid CSS color) */
    blockColor?: string;
    /** Block size in px */
    size?: number;
    /** Gap between blocks in px */
    gap?: number;
    /** Animation duration in seconds */
    speed?: number;
    /** Additional className */
    className?: string;
}

/**
 * High-performance block loader with horizontal 1x4 grid layout.
 * Uses GPU-accelerated transform animations for smooth 60fps performance.
 * 
 * Layout: 4 blocks in a horizontal row that pulse in sequence.
 */
const BlockLoader: React.FC<BlockLoaderProps> = ({
    blockColor = "#3b82f6", // blue-500
    size = 12,
    gap = 4,
    speed = 1.2,
    className,
}) => {
    return (
        <div
            className={cn("grid grid-cols-4", className)}
            style={{ gap }}
        >
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="rounded-sm"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: blockColor,
                        animation: `blockPulse ${speed}s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        willChange: "transform, opacity",
                    }}
                />
            ))}

            <style>{`
                @keyframes blockPulse {
                    0%, 80%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1.3);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default BlockLoader;
