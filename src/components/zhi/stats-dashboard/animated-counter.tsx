"use client";

import { useState, useEffect } from "react";

interface AnimatedCounterProps {
    end: number;
    duration?: number;
    trigger: number;
}

/**
 * Animated counter component that animates from 0 to the target value
 * with a randomized "slot machine" effect
 */
export function AnimatedCounter({
    end,
    duration = 2000,
    trigger,
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let frameId: number;

        const animate = (currentTime: number) => {
            if (startTime === null) {
                startTime = currentTime;
                setCount(0);
            }
            const progress = Math.min((currentTime - startTime) / duration, 1);

            if (progress < 1) {
                setCount(Math.floor(Math.random() * end * 1.5));
            } else {
                setCount(end);
            }

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [end, duration, trigger]);

    return <span>{count.toLocaleString()}</span>;
}
