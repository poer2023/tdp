"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
    label: string;
    fallbackHref?: string;
    className?: string;
}

/**
 * BackButton - A client component that navigates back to the previous page
 * Falls back to the specified href if there's no history
 */
export function BackButton({ label, fallbackHref = "/", className = "" }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        // Check if we have browser history to go back to
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else if (fallbackHref) {
            router.push(fallbackHref);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`text-blue-600 hover:underline dark:text-blue-400 cursor-pointer ${className}`}
        >
            {label}
        </button>
    );
}

export default BackButton;
