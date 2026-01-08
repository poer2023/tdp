"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

export function Footer() {
  const pathname = usePathname();

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const currentYear = new Date().getFullYear();

  const links = [
    {
      href: localePath(locale, "/posts"),
      label: locale === "zh" ? "博客" : "Blog",
    },
    {
      href: localePath(locale, "/gallery"),
      label: locale === "zh" ? "相册" : "Gallery",
    },
  ];

  return (
    <footer className="mt-auto bg-transparent" role="contentinfo">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Compact Layout - Max 2 lines */}
        <div className="flex flex-col items-center gap-1.5 text-center sm:gap-2">
          {/* Line 1: Links + Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3">
            <nav className="flex items-center gap-2 sm:gap-3" aria-label="Footer navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <span className="text-stone-400 dark:text-stone-600">·</span>
            <p className="text-stone-600 dark:text-stone-400">
              © {currentYear} Hao · {locale === "zh" ? "用" : "Built with"} ❤️
            </p>
          </div>

          {/* Line 2: Tech Stack */}
          <p className="text-xs text-stone-500 dark:text-stone-500">
            Next.js 15 · React 19 · Tailwind CSS 4
          </p>
        </div>
      </div>
    </footer>
  );
}
