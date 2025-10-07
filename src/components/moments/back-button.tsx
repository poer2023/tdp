"use client";

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      aria-label="返回"
    >
      ← 返回
    </button>
  );
}
