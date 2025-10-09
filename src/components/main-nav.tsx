"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const links = [
    {
      href: localePath(locale, "/posts"),
      label: locale === "zh" ? "博客" : "Blog",
      match: "/posts",
    },
    {
      href: localePath(locale, "/m"),
      label: locale === "zh" ? "瞬间" : "Moments",
      match: "/m",
    },
    {
      href: localePath(locale, "/gallery"),
      label: locale === "zh" ? "相册" : "Gallery",
      match: "/gallery",
    },
    {
      href: localePath(locale, "/about"),
      label: locale === "zh" ? "关于" : "About",
      match: "/about",
    },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="flex items-center gap-6" role="navigation" aria-label="Main navigation">
        <Link
          href={locale === "zh" ? "/zh" : "/en"}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          aria-label="Home"
        >
          ZHI
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden items-center gap-6 md:flex">
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
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={() => setMobileMenuOpen(true)}
          aria-label={locale === "zh" ? "打开菜单" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white p-6 shadow-xl md:hidden dark:bg-zinc-950"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "zh" ? "导航菜单" : "Navigation menu"}
          >
            {/* Close button */}
            <div className="mb-8 flex items-center justify-between">
              <Link
                href={locale === "zh" ? "/zh" : "/en"}
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                ZHI
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={locale === "zh" ? "关闭菜单" : "Close menu"}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile navigation links */}
            <nav className="flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname.includes(link.match);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
