"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface TiltStyle {
    transform: string;
    transition: string;
}

interface UseTiltOptions {
    maxTilt?: number;
    scale?: number;
    speed?: number;
    disabled?: boolean;
}

/**
 * useTilt Hook - 3D Tilt Effect for Cards
 * 
 * Implements mouse-following 3D perspective tilt effect.
 * Respects prefers-reduced-motion for accessibility.
 * 
 * @example
 * const { ref, style, handlers } = useTilt({ maxTilt: 8 });
 * return <div ref={ref} style={style} {...handlers}>Card</div>;
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
    maxTilt = 8,
    scale = 1.02,
    speed = 300,
    disabled = false,
}: UseTiltOptions = {}) {
    const ref = useRef<T>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        // Lazy initializer - only runs on client
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    const [style, setStyle] = useState<TiltStyle>({
        transform: "",
        transition: `transform ${speed}ms ease-out`,
    });

    // Subscribe to reduced motion preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const isDisabled = disabled || prefersReducedMotion;

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<T>) => {
            if (isDisabled || !ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            // Use requestAnimationFrame for smoother performance
            requestAnimationFrame(() => {
                setStyle({
                    transform: `perspective(1000px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale(${scale})`,
                    transition: "transform 0.1s ease-out",
                });
            });
        },
        [isDisabled, maxTilt, scale]
    );

    const handleMouseLeave = useCallback(() => {
        if (isDisabled) return;

        setStyle({
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
            transition: `transform ${speed}ms ease-out`,
        });
    }, [isDisabled, speed]);

    const handleMouseEnter = useCallback(() => {
        if (isDisabled) return;
        // Prepare for interaction - shorten transition on enter
        setStyle((prev) => ({
            ...prev,
            transition: "transform 0.1s ease-out",
        }));
    }, [isDisabled]);

    return {
        ref,
        style: isDisabled ? {} : style,
        handlers: isDisabled
            ? {}
            : {
                onMouseMove: handleMouseMove,
                onMouseLeave: handleMouseLeave,
                onMouseEnter: handleMouseEnter,
            },
    };
}
