"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { usePathname } from "next/navigation";
import { Film, Gamepad2, Mail, Github, Twitter, MessageCircle, Compass, Zap } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";

interface ProfileWidgetProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
  bio?: string;
}

export function ProfileWidget({
  avatarUrl,
  name = "BaoZhi",
  title,
  bio,
}: ProfileWidgetProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [isFlipping, setIsFlipping] = React.useState(false);

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

  // Fallback avatar using initials
  const initials = name.slice(0, 2).toUpperCase();

  const handleAvatarHover = () => {
    if (!isFlipping) {
      setIsFlipping(true);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes border-spin {
          100% {
            transform: rotate(-360deg);
          }
        }
        @keyframes flip-y {
          0% {
            transform: rotateY(0);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        .animate-flip-y {
          animation: flip-y 1s ease-in-out forwards;
        }
      `}</style>
      <div className="group relative mb-6 rounded-2xl transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl">
        {/* Border Marquee Effect (Dual Neon Beams with Glow) */}
        <div className="absolute -inset-[2px] overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] opacity-100 blur-[2px] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_40%,#00ffff_50%,transparent_60%,transparent_90%,#ff00ff_100%)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_40%,#00ffff_50%,transparent_60%,transparent_90%,#ff00ff_100%)]" />
        </div>

        {/* Main Card Content */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-[#27272a] dark:bg-[#141416]">
          {/* Decor */}
          <div className="pointer-events-none absolute top-0 left-0 h-24 w-full bg-gradient-to-b from-stone-100 to-transparent dark:from-[#1f1f23]/60" />

          <div
            className={`relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-stone-200 shadow-xl dark:border-[#0a0a0b] dark:bg-[#27272a] ${isFlipping ? "animate-flip-y" : ""
              }`}
            style={{ perspective: "1000px" }}
            onMouseEnter={handleAvatarHover}
            onAnimationEnd={() => setIsFlipping(false)}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sage-400 to-sage-600 text-2xl font-bold text-white">
                {initials}
              </div>
            )}
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
      </div>
    </>
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
    "cursor-pointer p-2.5 rounded-xl text-stone-400 bg-stone-50 dark:bg-[#1f1f23] border border-stone-100 dark:border-[#2a2a2e] transition-all active:scale-95";
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
  icon: "zap" | "film" | "gamepad2" | "book" | "music" | "code" | React.ReactNode;
  url?: string;
}

interface CompactStatusWidgetProps {
  items?: StatusItem[];
  updatedAt?: string;
}

// Icon mapping function
function getIconComponent(icon: StatusItem["icon"]): React.ReactNode {
  if (typeof icon !== "string") return icon;

  const iconMap: Record<string, React.ReactNode> = {
    zap: <Zap size={16} className="text-amber-500" />,
    film: <Film size={16} className="text-rose-500" />,
    gamepad2: <Gamepad2 size={16} className="text-indigo-500" />,
    book: <Compass size={16} className="text-emerald-500" />,
    music: <Compass size={16} className="text-purple-500" />,
    code: <Compass size={16} className="text-cyan-500" />,
  };

  return iconMap[icon] || <Zap size={16} className="text-stone-400" />;
}

export function CompactStatusWidget({ items, updatedAt }: CompactStatusWidgetProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "At a Glance": "At a Glance",
        "Focusing on": "Focusing on",
        "Watching": "Watching",
        "Playing": "Playing",
      },
      zh: {
        "At a Glance": "概览",
        "Focusing on": "正在专注",
        "Watching": "正在看",
        "Playing": "正在玩",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const defaultItems: StatusItem[] = [
    {
      label: "Focusing on",
      value: "Product Strategy",
      icon: "zap",
    },
    {
      label: "Watching",
      value: "Oppenheimer",
      icon: "film",
    },
    {
      label: "Playing",
      value: "Black Myth: Wukong",
      icon: "gamepad2",
    },
  ];

  const displayItems = items && items.length > 0 ? items : defaultItems;
  const displayUpdatedAt = updatedAt || "2 HRS AGO";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-[#27272a] dark:bg-[#141416]">
      <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
        <Zap size={14} className="text-amber-500" />
        {t("At a Glance")}
      </h4>

      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <StatusRow
            key={index}
            label={t(item.label)}
            value={item.value}
            icon={getIconComponent(item.icon)}
            url={item.url}
          />
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
  url?: string;
}

function StatusRow({ label, value, icon, url }: StatusRowProps) {
  const content = (
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-100 bg-stone-50 text-stone-400 transition-colors group-hover:bg-white dark:border-[#2a2a2e] dark:bg-[#1f1f23] dark:group-hover:bg-[#27272a]">
          {icon}
        </div>
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
      </div>
      <span className={`max-w-[120px] truncate text-right text-xs font-bold text-stone-800 dark:text-stone-200 ${url ? 'group-hover:text-sage-600 dark:group-hover:text-sage-400' : ''}`}>
        {value}
      </span>
    </div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return content;
}

