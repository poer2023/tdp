"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale-path";

interface MomentTabsProps {
  locale: "en" | "zh";
  currentPath: string;
}

export function MomentTabs({ locale, currentPath }: MomentTabsProps) {
  const tabs = [
    {
      href: localePath(locale, "/m"),
      label: locale === "zh" ? "我的瞬间" : "My Moments",
      isActive: currentPath === localePath(locale, "/m"),
    },
    {
      href: localePath(locale, "/m/friends"),
      label: locale === "zh" ? "朋友故事" : "Friends",
      isActive: currentPath.includes("/m/friends"),
    },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              tab.isActive
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            } `}
            aria-current={tab.isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
