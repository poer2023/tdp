// Gallery utility functions

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date string to localized format
 */
export function formatDate(dateString: string | null | undefined, locale: string = "zh"): string {
    if (!dateString) return locale === "zh" ? "未知" : "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Format bytes to MB with appropriate precision
 */
export function formatBytes(bytes: number): string {
    if (!bytes) return "0.00 MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 100) return `${mb.toFixed(0)} MB`;
    if (mb >= 10) return `${mb.toFixed(1)} MB`;
    return `${mb.toFixed(2)} MB`;
}

/**
 * Format loading progress percentage
 */
export function formatProgress(loaded: number, total: number | null): string {
    if (!total || total <= 0) return "";
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    return ` ${pct}%`;
}

/**
 * Format date to relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | null | undefined, locale: string = "zh"): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return locale === "zh" ? "今天" : "Today";
    if (diffDays === 1) return locale === "zh" ? "昨天" : "Yesterday";
    if (diffDays < 7) return locale === "zh" ? `${diffDays} 天前` : `${diffDays} days ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return locale === "zh" ? `${weeks} 周前` : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return locale === "zh" ? `${months} 个月前` : `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return locale === "zh" ? `${years} 年前` : `${years} year${years > 1 ? "s" : ""} ago`;
}
