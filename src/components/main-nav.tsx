"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav() {
  const pathname = usePathname();

  // Detect current locale from pathname
  const isZhLocale = pathname.startsWith("/zh");
  const locale = isZhLocale ? "/zh" : "";

  const links = [
    {
      href: `${locale}/posts`,
      label: isZhLocale ? "博客" : "Blog",
      match: "/posts",
    },
    {
      href: "/gallery",
      label: isZhLocale ? "相册" : "Gallery",
      match: "/gallery",
    },
  ];

  return (
    <nav className="flex items-center gap-8">
      <Link
        href={locale || "/"}
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        Hao
      </Link>
      {links.map((link) => {
        const isActive = pathname.includes(link.match);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              isActive
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
