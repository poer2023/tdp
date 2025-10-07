"use client";

export function OpenComposerButton({ label }: { label: string }) {
  return (
    <button
      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      onClick={() => window.dispatchEvent(new CustomEvent("open-moment-composer"))}
      type="button"
    >
      {label}
    </button>
  );
}
