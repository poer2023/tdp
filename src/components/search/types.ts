"use client";

import type { SearchResult, GallerySearchResult, MomentSearchResult } from "@/lib/search";
import type { SearchHistoryItem } from "@/lib/search-history";
import type { PublicLocale } from "@/lib/locale-path";

// ─────────────────────────────────────────────────────────────────────────────
// Search Results
// ─────────────────────────────────────────────────────────────────────────────

export type SearchResults = {
    posts: SearchResult[];
    images: GallerySearchResult[];
    moments: MomentSearchResult[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Search Position Anchor (for desktop overlay positioning)
// ─────────────────────────────────────────────────────────────────────────────

export type SearchAnchor = {
    right: number;
    top: number;
    width: number;
    maxHeight: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook Return Types
// ─────────────────────────────────────────────────────────────────────────────

export type UseSearchReturn = {
    q: string;
    setQ: (value: string) => void;
    results: SearchResults;
    loading: boolean;
    searchHistory: SearchHistoryItem[];
    handleHistoryItemClick: (query: string) => void;
    handleRemoveHistory: (query: string, e: React.MouseEvent) => void;
    goToFullPage: () => void;
};

export type UseSearchPositionReturn = {
    anchor: SearchAnchor | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

export type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
    onClear: () => void;
    locale: PublicLocale;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    variant?: "mobile" | "desktop";
};

export type SearchHistoryListProps = {
    history: SearchHistoryItem[];
    onItemClick: (query: string) => void;
    onRemove: (query: string, e: React.MouseEvent) => void;
    locale: PublicLocale;
    variant?: "mobile" | "desktop";
};

export type SearchResultsContainerProps = {
    results: SearchResults;
    locale: PublicLocale;
    variant?: "mobile" | "desktop";
};

export type MobileDrawerProps = {
    open: boolean;
    q: string;
    setQ: (value: string) => void;
    loading: boolean;
    results: SearchResults;
    searchHistory: SearchHistoryItem[];
    locale: PublicLocale;
    inputRef: React.RefObject<HTMLInputElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onSubmit: () => void;
    onHistoryItemClick: (query: string) => void;
    onRemoveHistory: (query: string, e: React.MouseEvent) => void;
};

export type DesktopOverlayProps = {
    open: boolean;
    q: string;
    setQ: (value: string) => void;
    loading: boolean;
    results: SearchResults;
    searchHistory: SearchHistoryItem[];
    locale: PublicLocale;
    anchor: SearchAnchor | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onSubmit: () => void;
    onHistoryItemClick: (query: string) => void;
    onRemoveHistory: (query: string, e: React.MouseEvent) => void;
};

// Re-export for convenience
export type { SearchResult, GallerySearchResult, MomentSearchResult };
export type { SearchHistoryItem };
