"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // 将 activities 转换为展示项 (使用 useMemo 避免每次渲染都创建新数组)
  const items = useMemo<ScrollSyncItem[]>(
    () =>
      activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        subtitle: formatRelativeTime(activity.date, locale),
        image: activity.image,
        href:
          activity.type === "post"
            ? `/${locale}/posts/${activity.slug}`
            : `/${locale}/gallery#${activity.id}`,
        type: activity.type,
      })),
    [activities, locale]
  );

  // 双向滚动同步 + 模糊效果
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right || items.length === 0) return;

    let ticking = false;
    let syncing: "left" | "right" | null = null;

    const updateBlur = () => {
      const containerRect = left.getBoundingClientRect();
      const centerY = containerRect.height / 2;
      const buttons = left.querySelectorAll("button");
      let closestIdx = 0;
      let minDistance = Infinity;

      buttons.forEach((btn, idx) => {
        const btnRect = btn.getBoundingClientRect();
        // 计算按钮中心相对于容器顶部的位置
        const btnCenterY = btnRect.top + btnRect.height / 2 - containerRect.top;
        const distance = Math.abs(btnCenterY - centerY);

        // 找到最接近中心的标题
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }

        // 计算模糊比例（基于容器高度的一半）
        const maxDistance = containerRect.height / 2;
        const ratio = Math.min(distance / maxDistance, 1);

        // 模糊值: 中心0px, 边缘6px（降低最大模糊）
        const blurValue = ratio * 6;
        // 透明度: 中心1, 边缘0.4（提高最小透明度）
        const opacityValue = 1 - ratio * 0.6;

        (btn as HTMLElement).style.filter = `blur(${blurValue}px)`;
        (btn as HTMLElement).style.opacity = `${opacityValue}`;
      });

      return closestIdx;
    };

    const sync = (from: "left" | "right") => {
      if (from === "left") {
        // 左侧滚动时：找到最接近视口中心的标题
        const activeIdx = updateBlur();
        setActive(activeIdx);

        // 同步右侧滚动到对应图片
        const rightTotal = right.scrollHeight - right.clientHeight;
        const rightTop = (activeIdx / Math.max(items.length - 1, 1)) * rightTotal;
        right.scrollTo({ top: rightTop });
      } else {
        // 右侧滚动时：计算应该激活的索引
        const ra = right.scrollTop / Math.max(right.scrollHeight - right.clientHeight, 1);
        const activeIdx = Math.round(ra * (items.length - 1));
        const clampedIdx = Math.min(Math.max(activeIdx, 0), items.length - 1);
        setActive(clampedIdx);

        // 同步左侧：将对应标题滚动到视口中心
        const buttons = left.querySelectorAll("button");
        const targetBtn = buttons[clampedIdx] as HTMLElement;
        if (targetBtn) {
          const targetRect = targetBtn.getBoundingClientRect();
          const leftRect = left.getBoundingClientRect();
          const targetCenter = targetRect.top - leftRect.top + targetRect.height / 2;
          const containerCenter = left.clientHeight / 2;
          const offset = targetCenter - containerCenter;
          left.scrollTo({ top: left.scrollTop + offset });
        }

        // 更新模糊效果
        updateBlur();
      }
    };

    const onLeft = () => {
      // 如果是右侧触发的同步，直接忽略左侧的滚动事件
      if (syncing === "right") {
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (syncing !== "right") {
            // 再次检查，避免竞态条件
            syncing = "left";
            sync("left");
            ticking = false;
            // 延迟50ms后重置，确保所有同步触发的滚动事件都被忽略
            setTimeout(() => {
              syncing = null;
            }, 50);
          } else {
            ticking = false;
          }
        });
        ticking = true;
      }
    };

    const onRight = () => {
      // 如果是左侧触发的同步，直接忽略右侧的滚动事件
      if (syncing === "left") {
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (syncing !== "left") {
            // 再次检查，避免竞态条件
            syncing = "right";
            sync("right");
            ticking = false;
            // 延迟50ms后重置，确保所有同步触发的滚动事件都被忽略
            setTimeout(() => {
              syncing = null;
            }, 50);
          } else {
            ticking = false;
          }
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
  }, [items]);

  const scrollToIndex = (i: number) => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    // 将目标标题滚动到视口中心
    const buttons = left.querySelectorAll("button");
    const targetBtn = buttons[i] as HTMLElement;
    if (targetBtn) {
      const targetRect = targetBtn.getBoundingClientRect();
      const leftRect = left.getBoundingClientRect();
      const targetCenter = targetRect.top - leftRect.top + targetRect.height / 2;
      const containerCenter = left.clientHeight / 2;
      const offset = targetCenter - containerCenter;
      left.scrollTo({ top: left.scrollTop + offset, behavior: "smooth" });
    }

    // 右侧同步滚动
    const rightTotal = right.scrollHeight - right.clientHeight;
    const rightTop = (i / Math.max(items.length - 1, 1)) * rightTotal;
    right.scrollTo({ top: rightTop, behavior: "smooth" });

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
    <section className="relative">
      {/* 隐藏滚动条 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 大容器约束区域 */}
      <div className="relative h-[80vh] overflow-hidden md:h-[85vh]">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          {/* 左列：标题列表 */}
          <div
            ref={leftRef}
            className="no-scrollbar h-full overflow-y-auto py-12"
            aria-label="Titles"
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => scrollToIndex(i)}
                aria-current={i === active ? "true" : "false"}
                className="group w-full py-8 text-left transition-all duration-200 md:py-12"
              >
                <div className="space-y-1">
                  <div className="text-xl leading-tight font-semibold tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50">
                    {item.title}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{item.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          {/* 右列：图片纵向列表 */}
          <div
            ref={rightRef}
            className="no-scrollbar h-full overflow-x-hidden overflow-y-auto"
            aria-label="Images"
          >
            {items.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                className={[
                  "mb-4 block overflow-hidden transition-transform duration-300 md:mb-6",
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
                      i === active ? "scale-[1.02]" : "",
                    ].join(" ")}
                    draggable={false}
                  />
                </div>
              </Link>
            ))}
          </div>
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
