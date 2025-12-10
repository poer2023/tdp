import type { PinyinOptions } from "pinyin-pro";

type PinyinFn = (text: string, options?: PinyinOptions) => unknown;

let cachedPinyin: PinyinFn | null = null;

async function loadPinyin(): Promise<PinyinFn> {
  if (cachedPinyin) return cachedPinyin;
  const mod = await import("pinyin-pro");
  cachedPinyin = mod.pinyin;
  return cachedPinyin;
}

/**
 * Lazily load pinyin-pro in Node runtime only. Returns a flat string result.
 */
export async function toPinyinString(
  text: string,
  options?: PinyinOptions
): Promise<string> {
  const pinyin = await loadPinyin();
  const result = pinyin(text, options);

  if (typeof result === "string") return result;
  if (Array.isArray(result)) {
    return (result as unknown[]).flat(2).join("");
  }
  return String(result ?? "");
}

// Test-only utility to clear cached module between tests if needed.
export function __resetPinyinCache() {
  cachedPinyin = null;
}
