"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
    titleKey: "quickActions",
    items: [
      { labelKey: "overview", href: "/admin", descriptionKey: "dashboard" },
      {
        labelKey: "trafficStats",
        href: "/admin/analytics",
        descriptionKey: "trafficStatsDescription",
      },
    ],
  },
  {
    titleKey: "content",
    items: [
      { labelKey: "posts", href: "/admin/posts", descriptionKey: "managePosts" },
      { labelKey: "moments", href: "/admin/moments", descriptionKey: "momentsDescription" },
      { labelKey: "curated", href: "/admin/curated", descriptionKey: "curatedDescription" },
      { labelKey: "projects", href: "/admin/projects", descriptionKey: "projectsDescription" },
    ],
  },
  {
    titleKey: "management",
    items: [
      {
        labelKey: "friends",
        href: "/admin/friends",
        descriptionKey: "friendManagementDescription",
      },
      {
        labelKey: "subscriptions",
        href: "/admin/subscriptions",
        descriptionKey: "subscriptionDescription",
      },
      {
        labelKey: "credentials",
        href: "/admin/credentials",
        descriptionKey: "credentialDescription",
      },
    ],
  },
  {
    titleKey: "media",
    items: [
      { labelKey: "gallery", href: "/admin/gallery", descriptionKey: "photoManagement" },
      { labelKey: "heroImages", href: "/admin/hero", descriptionKey: "heroImagesDescription" },
    ],
  },
  {
    titleKey: "quantifiedSelf",
    items: [
      { labelKey: "lifeLogData", href: "/admin/data", descriptionKey: "lifeLogDataDescription" },
    ],
  },
  {
    titleKey: "system",
    items: [
      {
        labelKey: "syncDashboard",
        href: "/admin/sync",
        descriptionKey: "syncDashboardDescription",
      },
      { labelKey: "tools", href: "/admin/tools", descriptionKey: "toolsDescription" },
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

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <nav
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-stone-950 text-stone-50 transition-transform duration-200 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      aria-label="Admin navigation"
    >
      {/* Header with Logo */}
      <div className="px-6 py-6">
        <Link href="/admin" className="block">
          <h1 className="font-serif text-xl font-bold tracking-tight text-white">
            Lumina CMS
          </h1>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="admin-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {navSections.map((section, idx) => (
          <div key={section.titleKey} className={idx > 0 ? "mt-6" : ""}>
            {/* Section Title */}
            <h2 className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-100">
              {t(locale, section.titleKey)}
            </h2>

            {/* Section Items */}
            <ul className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-150 ${
                        isActive
                          ? "bg-sage-500 text-white font-semibold shadow-md before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-sage-300 before:rounded-full"
                          : "font-medium text-stone-200 hover:bg-stone-800 hover:text-white"
                      }`}
                    >
                      <span>{t(locale, item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="border-t border-stone-800 px-3 py-4">
        {/* Back to Site */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-stone-800 hover:text-white"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t(locale, "backToSite")}</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-900/20"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>

        {/* Close button for mobile */}
        <div className="mt-3 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-100 hover:bg-stone-900 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </button>
        </div>
      </div>
    </nav>
  );
}
