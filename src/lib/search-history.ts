/**
 * Search history management using localStorage
 * Stores recent search queries with deduplication and size limits
 */

const STORAGE_KEY = "tdp_search_history";
const MAX_HISTORY_SIZE = 10;

export type SearchHistoryItem = {
  query: string;
  timestamp: number;
};

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as SearchHistoryItem[];
    // Validate structure
    if (!Array.isArray(history)) return [];

    return history.filter((item) => item.query && typeof item.timestamp === "number");
  } catch {
    return [];
  }
}

/**
 * Add a query to search history (deduplicates and maintains size limit)
 */
export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  if (!query.trim()) return;

  try {
    const history = getSearchHistory();

    // Remove existing entry if present (for deduplication)
    const filtered = history.filter((item) => item.query !== query.trim());

    // Add new entry at the beginning
    const updated = [{ query: query.trim(), timestamp: Date.now() }, ...filtered].slice(
      0,
      MAX_HISTORY_SIZE
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

/**
 * Remove a specific query from history
 */
export function removeFromSearchHistory(query: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getSearchHistory();
    const filtered = history.filter((item) => item.query !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from search history:", error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}

/**
 * Get popular search suggestions based on history frequency
 */
export function getSearchSuggestions(limit = 5): string[] {
  const history = getSearchHistory();
  return history.slice(0, limit).map((item) => item.query);
}
