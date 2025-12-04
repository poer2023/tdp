"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Film, Gamepad2, Mail, Github, Twitter, MessageCircle, Compass, Zap } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

interface ProfileWidgetProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
  bio?: string;
}

export function ProfileWidget({
  avatarUrl = "https://aistudiocdn.com/72b5f4228e1b81681e679509282e412406e613940be14c87e7544f4d02e95506.jpg",
  name = "BaoZhi",
  title,
  bio,
}: ProfileWidgetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Secret entrance: click avatar 5 times within 2 seconds to access friends page
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldNavigateRef = useRef(false);

  // Handle navigation outside of setState to avoid React warning
  React.useEffect(() => {
    if (shouldNavigateRef.current) {
      shouldNavigateRef.current = false;
      router.push(localePath(locale, "/m/friends"));
    }
  }, [clickCount, locale, router]);

  const handleAvatarClick = useCallback(() => {
    // Reset timeout on each click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    setClickCount((prev) => {
      const newCount = prev + 1;

      // Mark for navigation on 5th click
      if (newCount >= 5) {
        shouldNavigateRef.current = true;
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
        return 0; // Reset count
      }

      return newCount;
    });
  }, []);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Product Manager": "Product Manager",
      },
      zh: {
        "Product Manager": "产品经理",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const displayTitle = title || t("Product Manager");
  const displayBio =
    bio ||
    "Turning chaos into roadmaps. Obsessed with UX, data, and the perfect cup of coffee.";

  return (
    <div className="group relative mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-[#27272a] dark:bg-[#141416]">
      {/* Decor */}
      <div className="pointer-events-none absolute top-0 left-0 h-24 w-full bg-gradient-to-b from-stone-100 to-transparent dark:from-[#1f1f23]/60" />

      <div
        onClick={handleAvatarClick}
        className="relative mx-auto mb-4 h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-stone-200 shadow-xl transition-transform duration-500 group-hover:scale-105 dark:border-[#0a0a0b] dark:bg-[#27272a]"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleAvatarClick();
          }
        }}
      >
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      </div>
      <h3 className="mb-1 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
        {name}
      </h3>
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-500" />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {displayTitle}
        </p>
      </div>

      <p className="mx-auto mb-6 max-w-[240px] font-serif text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {displayBio}
      </p>

      {/* Social Dock */}
      <div className="mb-6 flex justify-center gap-3">
        <SocialBtn icon={<Github size={18} />} label="Github" href="https://github.com" />
        <SocialBtn
          icon={<MessageCircle size={18} />}
          label="WeChat"
          color="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
        />
        <SocialBtn icon={<Twitter size={18} />} label="X" href="https://twitter.com" />
        <SocialBtn
          icon={<Compass size={18} />}
          label="RedNote"
          color="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
        />
        <SocialBtn icon={<Mail size={18} />} label="Email" href="mailto:contact@example.com" />
      </div>
    </div>
  );
}

interface SocialBtnProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  color?: string;
}

function SocialBtn({ icon, label, href, color }: SocialBtnProps) {
  const baseClasses =
    "p-2.5 rounded-xl text-stone-400 bg-stone-50 dark:bg-[#1f1f23] border border-stone-100 dark:border-[#2a2a2e] transition-all active:scale-95";
  const hoverClasses =
    color || "hover:bg-stone-200 hover:text-stone-900 dark:hover:bg-[#27272a] dark:hover:text-stone-100";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${hoverClasses}`}
        title={label}
      >
        {icon}
      </a>
    );
  }

  return (
    <button className={`${baseClasses} ${hoverClasses}`} title={label}>
      {icon}
    </button>
  );
}

interface StatusItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface CompactStatusWidgetProps {
  items?: StatusItem[];
  updatedAt?: string;
}

export function CompactStatusWidget({ items, updatedAt }: CompactStatusWidgetProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "At a Glance": "At a Glance",
      },
      zh: {
        "At a Glance": "概览",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const defaultItems: StatusItem[] = [
    {
      label: "Focusing on",
      value: "Product Strategy",
      icon: <Zap size={16} className="text-amber-500" />,
    },
    {
      label: "Watching",
      value: "Oppenheimer",
      icon: <Film size={16} className="text-rose-500" />,
    },
    {
      label: "Playing",
      value: "Black Myth: Wukong",
      icon: <Gamepad2 size={16} className="text-indigo-500" />,
    },
  ];

  const displayItems = items || defaultItems;
  const displayUpdatedAt = updatedAt || "2 HRS AGO";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-[#27272a] dark:bg-[#141416]">
      <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
        <Zap size={14} className="text-amber-500" />
        {t("At a Glance")}
      </h4>

      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <StatusRow key={index} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 font-mono text-[10px] text-stone-400 dark:border-[#27272a]">
        <span>UPDATED</span>
        <span>{displayUpdatedAt}</span>
      </div>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatusRow({ label, value, icon }: StatusRowProps) {
  return (
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-100 bg-stone-50 text-stone-400 transition-colors group-hover:bg-white dark:border-[#2a2a2e] dark:bg-[#1f1f23] dark:group-hover:bg-[#27272a]">
          {icon}
        </div>
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
      </div>
      <span className="max-w-[120px] truncate text-right text-xs font-bold text-stone-800 dark:text-stone-200">
        {value}
      </span>
    </div>
  );
}
