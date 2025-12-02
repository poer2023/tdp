"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getLocaleFromPathname } from "@/lib/i18n";

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname) ?? "en";

  // Generate alternate URL (both locales use explicit prefixes)
  const hasLocalePrefix = /^\/(en|zh)(?=\/|$)/.test(pathname);
  const pathWithoutLocale = hasLocalePrefix ? pathname.replace(/^\/(en|zh)(?=\/|$)/, "") : pathname;
  const isAdminRoute = pathname.startsWith("/admin");

  let alternateUrl: string;
  if (hasLocalePrefix || pathname === "/") {
    const base = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
    alternateUrl = currentLocale === "zh" ? `/en${base}` : `/zh${base}`;
  } else if (isAdminRoute) {
    // Admin routes are not localized by pathname; hide switcher.
    return null;
  } else {
    alternateUrl = currentLocale === "zh" ? "/" : "/zh";
  }

  const alternateLocale = currentLocale === "zh" ? "en" : "zh";
  const alternateLabel = currentLocale === "zh" ? "EN" : "中";

  return (
    <Link
      href={alternateUrl}
      className="flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 focus:ring-2 focus:ring-stone-400 focus:outline-none md:text-sm dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-900"
      aria-label={`Switch to ${alternateLocale === "zh" ? "Chinese" : "English"}`}
    >
      <svg
        className="h-4 w-4 text-stone-500 dark:text-stone-400"
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
      <span className="leading-none">{alternateLabel}</span>
    </Link>
  );
}
