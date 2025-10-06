"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RecentActivity } from "@/lib/posts";

type ScrollSyncItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  type: "post" | "gallery";
};

export function ScrollSyncHero({
  activities,
  locale,
}: {
  activities: RecentActivity[];
  locale: "zh" | "en";
}) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  // 将 activities 转换为展示项
  const items: ScrollSyncItem[] = activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    subtitle: formatRelativeTime(activity.date, locale),
    image: activity.image,
    href:
      activity.type === "post"
        ? `/${locale}/posts/${activity.slug}`
        : `/${locale}/gallery#${activity.id}`,
    type: activity.type,
  }));

  // 双向滚动同步
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right || items.length === 0) return;

    let ticking = false;
    let syncing: "left" | "right" | null = null;

    const sync = (from: "left" | "right") => {
      const a = from === "left" ? left : right;
      const b = from === "left" ? right : left;
      const ra = a.scrollTop / Math.max(a.scrollHeight - a.clientHeight, 1);
      b.scrollTo({ top: ra * (b.scrollHeight - b.clientHeight) });

      // 估算当前激活索引
      const itemH = (a.scrollHeight - a.clientHeight) / Math.max(items.length - 1, 1);
      const idx = Math.round(a.scrollTop / Math.max(itemH, 1));
      setActive(Math.min(Math.max(idx, 0), items.length - 1));
    };

    const onLeft = () => {
      if (syncing === "right") {
        syncing = null;
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          syncing = "left";
          sync("left");
          ticking = false;
        });
        ticking = true;
      }
    };

    const onRight = () => {
      if (syncing === "left") {
        syncing = null;
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          syncing = "right";
          sync("right");
          ticking = false;
        });
        ticking = true;
      }
    };

    left.addEventListener("scroll", onLeft, { passive: true });
    right.addEventListener("scroll", onRight, { passive: true });

    return () => {
      left.removeEventListener("scroll", onLeft);
      right.removeEventListener("scroll", onRight);
    };
  }, [items.length]);

  const scrollToIndex = (i: number) => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    const total = left.scrollHeight - left.clientHeight;
    const top = (i / Math.max(items.length - 1, 1)) * total;
    left.scrollTo({ top, behavior: "smooth" });
    right.scrollTo({ top, behavior: "smooth" });
    setActive(i);
  };

  if (items.length === 0) {
    return (
      <section className="py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          {locale === "zh" ? "暂无内容更新" : "No recent updates"}
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* 隐藏滚动条 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        {/* 左列：标题列表 */}
        <div
          ref={leftRef}
          className="no-scrollbar h-[60vh] snap-y snap-mandatory overflow-y-auto md:h-[72vh]"
          aria-label="Titles"
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => scrollToIndex(i)}
              aria-current={i === active ? "true" : "false"}
              className={[
                "group w-full snap-start py-6 text-left transition-all md:py-8",
                i === active ? "scale-[1.02]" : "opacity-60 hover:opacity-90",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.type === "post" ? "📝" : "📸"}</span>
                <div className="flex-1">
                  <div className="text-xl leading-tight font-semibold tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <div
                className={[
                  "mt-4 h-px",
                  i === active
                    ? "bg-zinc-900/70 dark:bg-zinc-100/70"
                    : "bg-zinc-300 dark:bg-zinc-700",
                ].join(" ")}
              />
            </button>
          ))}
        </div>

        {/* 右列：图片列表 */}
        <div
          ref={rightRef}
          className="no-scrollbar h-[60vh] snap-y snap-mandatory overflow-y-auto md:h-[72vh]"
          aria-label="Images"
        >
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              className={[
                "mb-4 block snap-start overflow-hidden rounded-2xl transition-transform md:mb-6",
                i === active ? "scale-[1.01]" : "scale-100",
              ].join(" ")}
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={450}
                  className={[
                    "h-full w-full object-cover transition-transform duration-500",
                    i === active ? "scale-[1.02]" : "group-hover:scale-105",
                  ].join(" ")}
                  draggable={false}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatRelativeTime(dateStr: string, locale: "zh" | "en") {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return locale === "zh" ? "刚刚" : "just now";
  if (diffInSeconds < 3600)
    return locale === "zh"
      ? `${Math.floor(diffInSeconds / 60)} 分钟前`
      : `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return locale === "zh"
      ? `${Math.floor(diffInSeconds / 3600)} 小时前`
      : `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return locale === "zh"
      ? `${Math.floor(diffInSeconds / 86400)} 天前`
      : `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000)
    return locale === "zh"
      ? `${Math.floor(diffInSeconds / 604800)} 周前`
      : `${Math.floor(diffInSeconds / 604800)}w ago`;

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
