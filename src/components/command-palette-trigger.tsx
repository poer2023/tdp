"use client";

import { useSearch } from "./global-search-provider";

type CommandPaletteTriggerProps = {
  size?: "sm" | "md";
};

export function CommandPaletteTrigger({ size = "md" }: CommandPaletteTriggerProps) {
  const { setOpen } = useSearch();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search"
      className={`flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus:ring-0 focus:outline-none dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-300 ${
        size === "sm" ? "h-7 w-7" : "h-9 w-9"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
  );
}
