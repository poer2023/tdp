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
      href: localePath(locale, "/moments"),
      label: locale === "zh" ? "我的瞬间" : "My Moments",
      isActive: currentPath === localePath(locale, "/moments"),
    },
    {
      href: localePath(locale, "/friends"),
      label: locale === "zh" ? "朋友故事" : "Friends",
      isActive: currentPath.includes("/friends"),
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${tab.isActive
              ? "bg-[#0F172A] text-white shadow-sm dark:bg-[#F8FAFC] dark:text-[#0F172A]"
              : "border border-[#E5E7EB] bg-transparent text-[#94A3B8] hover:bg-[#E5E7EB] dark:border-[rgba(248,250,252,0.2)] dark:text-[#CBD5F5] dark:hover:bg-[rgba(248,250,252,0.1)]"
            } focus-visible:outline-[#2563EB] dark:focus-visible:outline-[#93C5FD]`}
          aria-current={tab.isActive ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
