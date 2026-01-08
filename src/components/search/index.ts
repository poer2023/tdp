// Search component module exports
// Main entry point for the modular search component

export { Search, SearchMain } from "./search-main";
export type {
    SearchResults,
    SearchAnchor,
    UseSearchReturn,
    UseSearchPositionReturn,
    SearchInputProps,
    SearchHistoryListProps,
    SearchResultsContainerProps,
    MobileDrawerProps,
    DesktopOverlayProps,
} from "./types";

// Re-export hooks for advanced use cases
export { useSearch, useSearchPosition } from "./hooks";

// Re-export sub-components if needed
export {
    SearchInput,
    SearchHistoryList,
    SearchResultsContainer,
    MobileDrawer,
    DesktopOverlay,
} from "./components";

// Re-export existing components
export { SearchResultSkeleton } from "./search-skeleton";
export { SearchEmptyState } from "./search-empty-state";
