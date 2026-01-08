"use client";

import React from "react";
import { Send } from "lucide-react";

export type CommentInputProps = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    isLoggedIn: boolean;
    t: (key: string) => string;
    variant?: "mobile" | "desktop";
};

export function CommentInput({
    value,
    onChange,
    onSubmit,
    isSubmitting,
    isLoggedIn,
    t,
    variant = "desktop",
}: CommentInputProps) {
    const isMobile = variant === "mobile";

    return (
        <form
            onSubmit={onSubmit}
            className={`flex items-center gap-2 ${isMobile
                ? "p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50"
                : "p-4"
                }`}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={isLoggedIn ? t("writeComment") : t("loginToComment")}
                disabled={!isLoggedIn || isSubmitting}
                className={`flex-1 rounded-full border text-sm placeholder-stone-400 outline-none transition-colors focus:border-sage-500 disabled:cursor-not-allowed disabled:opacity-50 ${isMobile
                    ? "border-stone-200 bg-white px-4 py-2.5 text-stone-800 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-200 dark:placeholder-stone-400"
                    : "border-stone-200 bg-stone-50 px-4 py-2 text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500 dark:focus:border-sage-500"
                    }`}
            />
            <button
                type="submit"
                disabled={!isLoggedIn || !value.trim() || isSubmitting}
                className={`flex items-center justify-center rounded-full bg-sage-500 text-white transition-colors hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-50 ${isMobile ? "h-10 w-10" : "h-9 w-9"
                    }`}
            >
                <Send size={isMobile ? 18 : 16} />
            </button>
        </form>
    );
}
