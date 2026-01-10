"use client";

import { useRouter } from "next/navigation";
import { ZhiFeed } from "./feed";
import type { FeedItem, FeedPost } from "./feed";
import { localePath, type PublicLocale } from "@/lib/locale-path";

interface ZhiFeedWrapperProps {
    feedItems: FeedItem[];
    locale: PublicLocale;
}

/**
 * Client wrapper for ZhiFeed to handle navigation
 * Extracted from home-page.tsx to allow parent to be Server Component
 */
export function ZhiFeedWrapper({ feedItems, locale }: ZhiFeedWrapperProps) {
    const router = useRouter();

    const handlePostClick = (post: FeedPost) => {
        router.push(localePath(locale, `/posts/${post.slug}`));
    };

    return (
        <ZhiFeed
            initialItems={feedItems}
            onPostClick={handlePostClick}
        />
    );
}
