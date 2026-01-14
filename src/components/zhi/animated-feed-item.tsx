"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedFeedItemProps {
    children: ReactNode;
    /** Item index for stagger delay calculation */
    index?: number;
    /** Disable animation for this item */
    disabled?: boolean;
}

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 24,
    },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.06, // 60ms stagger
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], // easeOutQuad cubic-bezier
        },
    }),
};

/**
 * AnimatedFeedItem - Scroll-triggered fade-in animation wrapper
 * 
 * Wraps feed items to animate them when they enter the viewport.
 * Respects prefers-reduced-motion for accessibility.
 * Uses staggered delays based on index for pleasing cascade effect.
 * 
 * @example
 * {items.map((item, i) => (
 *   <AnimatedFeedItem key={item.id} index={i}>
 *     <FeedCard item={item} />
 *   </AnimatedFeedItem>
 * ))}
 */
export function AnimatedFeedItem({
    children,
    index = 0,
    disabled = false,
}: AnimatedFeedItemProps) {
    const prefersReducedMotion = useReducedMotion();

    // Skip animation if user prefers reduced motion or explicitly disabled
    if (prefersReducedMotion || disabled) {
        return <>{children}</>;
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            custom={index % 8} // Reset stagger every 8 items to prevent long delays
        >
            {children}
        </motion.div>
    );
}

/**
 * AnimatedList - Container for animated list items
 * 
 * Optional container that can be used to batch animate list items.
 */
export function AnimatedList({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className={className}
        >
            {children}
        </motion.div>
    );
}
