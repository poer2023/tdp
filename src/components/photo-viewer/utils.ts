/**
 * Format bytes to human readable MB string
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
