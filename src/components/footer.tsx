"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";

export function Footer() {
  const pathname = usePathname();

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const currentYear = new Date().getFullYear();

  const links = [
    {
      href: `/${locale}/posts`,
      label: locale === "zh" ? "博客" : "Blog",
    },
    {
      href: `/${locale}/gallery`,
      label: locale === "zh" ? "相册" : "Gallery",
    },
  ];

  return (
    <footer className="bg-transparent" role="contentinfo">
      <div className="mx-auto max-w-4xl px-6 py-6">
        {/* Compact Layout - Max 2 lines */}
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Line 1: Links + Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <nav className="flex items-center gap-3" aria-label="Footer navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <p className="text-zinc-600 dark:text-zinc-400">
              © {currentYear} Hao · {locale === "zh" ? "用" : "Built with"} ❤️
            </p>
          </div>

          {/* Line 2: Tech Stack */}
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Next.js 15 · React 19 · Tailwind CSS 4
          </p>
        </div>
      </div>
    </footer>
  );
}
