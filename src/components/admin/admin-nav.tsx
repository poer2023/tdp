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
    ],
  },
  {
    titleKey: "operations",
    items: [{ labelKey: "contentIO", href: "/admin/content-io", descriptionKey: "importExport" }],
  },
];

export function AdminNav({ locale }: { locale: AdminLocale }) {
  const pathname = usePathname();

  return (
    <nav className="w-64 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Header */}
        <div className="border-b border-zinc-200 px-6 py-8 dark:border-zinc-800">
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
        <div className="flex-1 overflow-y-auto px-4 py-6">
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
                            ? "border-l-2 border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/60"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
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

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span>←</span>
            <span>{t(locale, "backToSite")}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
