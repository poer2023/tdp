// Minimal option type to avoid relying on pinyin-pro's overloaded signature
type PinyinOptions = {
  type?: "string" | "array" | "all";
  separator?: string;
  toneType?: "none" | "symbol" | "num" | "tone";
  v?: boolean;
  multiple?: boolean;
  mode?: "normal" | "surname";
  surname?: "off" | "all" | "head";
  toneSandhi?: boolean;
  segmentit?: number;
  [key: string]: unknown;
};

type PinyinFn = (text: string, options?: PinyinOptions) => unknown;

let cachedPinyin: PinyinFn | null = null;

async function loadPinyin(): Promise<PinyinFn> {
  if (cachedPinyin) return cachedPinyin;
  const mod = await import("pinyin-pro");
  cachedPinyin = mod.pinyin as PinyinFn;
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
