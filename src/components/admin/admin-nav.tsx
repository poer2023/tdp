"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminLocale } from "@/lib/admin-translations";
import { t } from "@/lib/admin-translations";

type NavSection = {
  titleKey: keyof typeof import("@/lib/admin-translations").adminTranslations.en;
  items: NavItem[];
};

type NavItem = {
  labelKey: keyof typeof import("@/lib/admin-translations").adminTranslations.en;
  href: string;
  descriptionKey: keyof typeof import("@/lib/admin-translations").adminTranslations.en;
};

const navSections: NavSection[] = [
  {
    titleKey: "content",
    items: [
      { labelKey: "overview", href: "/admin", descriptionKey: "dashboard" },
      { labelKey: "posts", href: "/admin/posts", descriptionKey: "managePosts" },
      { labelKey: "gallery", href: "/admin/gallery", descriptionKey: "photoManagement" },
      { labelKey: "analytics", href: "/admin/analytics", descriptionKey: "analyticsDescription" },
    ],
  },
  {
    titleKey: "operations",
    items: [
      { labelKey: "contentIO", href: "/admin/content-io", descriptionKey: "importExport" },
      {
        labelKey: "subscriptions",
        href: "/admin/subscriptions",
        descriptionKey: "subscriptionDescription",
      },
    ],
  },
];

export function AdminNav({
  locale,
  mobileOpen,
  onClose,
}: {
  locale: AdminLocale;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed top-16 left-0 z-40 flex h-[calc(100vh-64px)] w-64 flex-col bg-white transition-transform duration-200 md:translate-x-0 dark:bg-zinc-950 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      aria-label="Admin navigation"
    >
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <Link href="/admin" className="block">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t(locale, "admin")}
          </h1>
          <p className="mt-1 text-sm leading-tight text-zinc-500 dark:text-zinc-400">
            {t(locale, "contentManagement")}
          </p>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="admin-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {navSections.map((section, idx) => (
          <div key={section.titleKey} className={idx > 0 ? "mt-8" : ""}>
            {/* Section Title */}
            <h2 className="px-3 text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              {t(locale, section.titleKey)}
            </h2>

            {/* Section Items */}
            <ul className="mt-3 space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group block rounded-lg px-3 py-2.5 transition-all duration-150 ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-900/60"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {t(locale, item.labelKey)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 text-xs leading-tight ${
                          isActive
                            ? "text-zinc-600 dark:text-zinc-400"
                            : "text-zinc-500 dark:text-zinc-500"
                        }`}
                      >
                        {t(locale, item.descriptionKey)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer - Fixed at bottom (no divider) */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span>←</span>
          <span>{t(locale, "backToSite")}</span>
        </Link>
        {/* Close button for mobile */}
        <div className="mt-4 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            关闭
          </button>
        </div>
      </div>
    </nav>
  );
}
