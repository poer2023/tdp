"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { localePath, type PublicLocale } from "@/lib/locale-path";
import {
    getSearchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
} from "@/lib/search-history";
import type { SearchResults, UseSearchReturn, SearchHistoryItem } from "../types";

const EMPTY_RESULTS: SearchResults = { posts: [], images: [], moments: [] };

export function useSearch(
    open: boolean,
    locale: PublicLocale,
    inputRef: React.RefObject<HTMLInputElement | null>,
    onClose: () => void
): UseSearchReturn {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const router = useRouter();

    const serverLocale = (locale === "zh" ? "ZH" : "EN") as "EN" | "ZH";

    // Load search history on mount and when opening
    useEffect(() => {
        if (open) {
            setSearchHistory(getSearchHistory());
        }
    }, [open]);

    // Debounced search with full mode for all content types
    useEffect(() => {
        if (!open) return;
        if (!q.trim()) {
            setResults(EMPTY_RESULTS);
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(q.trim())}&locale=${serverLocale}&mode=full`,
                    { signal: ctrl.signal }
                );
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();
                setResults({
                    posts: data.posts || [],
                    images: data.images || [],
                    moments: data.moments || [],
                });
            } catch (e) {
                if (!(e instanceof DOMException && e.name === "AbortError")) {
                    setResults(EMPTY_RESULTS);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            ctrl.abort();
            clearTimeout(t);
        };
    }, [q, open, serverLocale]);

    const goToFullPage = useCallback(() => {
        const query = q.trim();
        if (query) {
            addToSearchHistory(query);
        }
        const searchPath = localePath(locale, "/search");
        const target = `${searchPath}?q=${encodeURIComponent(query)}`;
        onClose();
        router.push(target);
    }, [q, locale, router, onClose]);

    const handleHistoryItemClick = useCallback((query: string) => {
        setQ(query);
        // Focus input after setting query
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [inputRef]);

    const handleRemoveHistory = useCallback((query: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        removeFromSearchHistory(query);
        setSearchHistory(getSearchHistory());
    }, []);

    return {
        q,
        setQ,
        results,
        loading,
        searchHistory,
        handleHistoryItemClick,
        handleRemoveHistory,
        goToFullPage,
    };
}
