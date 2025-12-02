"use client";

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
      aria-label="返回"
    >
      ← 返回
    </button>
  );
}
