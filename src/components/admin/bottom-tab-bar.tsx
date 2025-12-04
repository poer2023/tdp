"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminLocale } from "@/lib/admin-translations";
import { t } from "@/lib/admin-translations";

type TabItem = {
  labelKey: keyof typeof import("@/lib/admin-translations").adminTranslations.en;
  href: string;
  icon: ReactNode;
};

const primaryTabs: TabItem[] = [
  {
    labelKey: "dashboard",
    href: "/admin",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
];

type BottomTabBarProps = {
  locale: AdminLocale;
};

export function BottomTabBar({ locale }: BottomTabBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-stone-800 bg-stone-950/95 text-stone-50 backdrop-blur supports-[backdrop-filter]:bg-stone-950/80 md:hidden">
      <div className="flex h-16 items-center justify-center gap-2 px-2">
        {primaryTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                active ? "text-sage-300 font-bold" : "text-stone-100 hover:text-white"
              }`}
            >
              <div>{tab.icon}</div>
              <span className="text-[10px] font-medium">{t(locale, tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
