"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

export function MainNav() {
  const pathname = usePathname();

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const links = [
    {
      href: localePath(locale, "/posts"),
      label: locale === "zh" ? "博客" : "Blog",
      match: "/posts",
    },
    {
      href: localePath(locale, "/gallery"),
      label: locale === "zh" ? "相册" : "Gallery",
      match: "/gallery",
    },
  ];

  return (
    <nav className="flex items-center gap-6" role="navigation" aria-label="Main navigation">
      <Link
        href={locale === "zh" ? "/zh" : "/"}
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        aria-label="Home"
      >
        Hao
      </Link>
      {links.map((link) => {
        const isActive = pathname.includes(link.match);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm leading-6 transition-colors ${
              isActive
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
