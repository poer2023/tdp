"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition, useMemo } from "react";
import type { AdminLocale } from "@/lib/admin-translations";
import { t } from "@/lib/admin-translations";
import { cn } from "@/lib/utils";
import { ListBox, ListBoxItem, Surface, Button as HeroButton } from "@/components/ui-heroui";
import Link from "next/link";

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
      { labelKey: "tools", href: "/admin/tools", descriptionKey: "toolsDescription" },
      {
        labelKey: "subscriptions",
        href: "/admin/subscriptions",
        descriptionKey: "subscriptionDescription",
      },
      {
        labelKey: "friends",
        href: "/admin/friends",
        descriptionKey: "friendManagementDescription",
      },
      {
        labelKey: "credentials",
        href: "/admin/credentials",
        descriptionKey: "credentialDescription",
      },
      {
        labelKey: "syncDashboard",
        href: "/admin/sync",
        descriptionKey: "syncDashboardDescription",
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
  const router = useRouter();
  const [, startTransition] = useTransition();

  const flatItems = useMemo(() => {
    return navSections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        section: section.titleKey,
      }))
    );
  }, []);

  const currentKey =
    flatItems.find((item) => pathname === item.href || pathname.startsWith(item.href))?.href ??
    flatItems[0]?.href;

  const handleSelectionChange = (key: React.Key) => {
    const href = String(key);
    startTransition(() => router.push(href));
    onClose?.();
  };

  return (
    <Surface
      variant="flat"
      className={cn(
        "fixed top-16 left-0 z-40 flex h-[calc(100vh-64px)] w-64 flex-col border-r border-zinc-100 bg-white/90 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/90",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "transition-transform duration-200"
      )}
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
            <ListBox
              aria-label={t(locale, section.titleKey)}
              selectedKeys={currentKey ? new Set([currentKey]) : new Set()}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                if (selectedKey && typeof selectedKey === 'string') {
                  handleSelectionChange(selectedKey);
                }
              }}
              variant="flat"
              selectionMode="single"
              className="mt-3"
            >
              {section.items.map((item) => (
                <ListBoxItem key={item.href} id={item.href} textValue={t(locale, item.labelKey)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {t(locale, item.labelKey)}
                    </span>
                  </div>
                </ListBoxItem>
              ))}
            </ListBox>
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
          <HeroButton
            variant="light"
            size="sm"
            onPress={onClose}
            className="w-full justify-center"
          >
            关闭
          </HeroButton>
        </div>
      </div>
    </Surface>
  );
}
