"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getLocaleFromPathname } from "@/lib/i18n";

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname) ?? "en";

  // Generate alternate URL by replacing locale prefix
  const getAlternateUrl = () => {
    if (currentLocale === "zh") {
      // /zh/... → /en/...
      return pathname.replace(/^\/zh/, "/en");
    } else {
      // /en/... → /zh/...
      return pathname.replace(/^\/en/, "/zh");
    }
  };

  const alternateUrl = getAlternateUrl();
  const alternateLocale = currentLocale === "zh" ? "en" : "zh";
  const alternateLabel = currentLocale === "zh" ? "EN" : "中";

  return (
    <Link
      href={alternateUrl}
      className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-400 focus:outline-none dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      aria-label={`Switch to ${alternateLocale === "zh" ? "Chinese" : "English"}`}
    >
      <svg
        className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span>{alternateLabel}</span>
    </Link>
  );
}
