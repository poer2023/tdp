/**
 * Safe JSON-LD serialization helper
 * Escapes < and > to prevent XSS injection via </script> tags
 */
export function safeJsonLd(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e");
}
