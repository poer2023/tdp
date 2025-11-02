"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

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
    {
      href: localePath(locale, "/about/changelog"),
      label: locale === "zh" ? "开发日志" : "Changelog",
      match: "/about/changelog",
    },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    startTransition(() => setMobileMenuOpen(false));
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

      {/* Mobile Menu Drawer - rendered via Portal to document.body */}
      {mounted &&
        createPortal(
          <>
            {/* Backdrop overlay */}
            <div
              className={`fixed inset-0 z-[9998] bg-black/15 transition-opacity duration-300 ease-out md:hidden dark:bg-black/25 ${
                mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
              className={`fixed top-0 right-0 left-0 z-[9999] overflow-y-auto overscroll-contain bg-white/30 px-4 py-3 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ease-out md:hidden dark:bg-zinc-900/30 ${
                mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label={locale === "zh" ? "导航菜单" : "Navigation menu"}
            >
              {/* Mobile navigation links */}
              <nav className="flex flex-col gap-2 pb-2">
                {links.map((link) => {
                  const isActive = pathname.includes(link.match);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-lg px-4 py-3 text-base font-medium transition-all ${
                        isActive
                          ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
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
          </>,
          document.body
        )}
    </>
  );
}
