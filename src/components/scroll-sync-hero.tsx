"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RecentActivity } from "@/lib/posts";
import { localePath } from "@/lib/locale-path";

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
  const heroTitle = locale === "zh" ? "留住\n柔软瞬间" : "Moments that\nstay soft";
  const heroSubtitle = locale === "zh" ? "个人笔记。简单心情。" : "Personal notes. Simple moods.";
  const leftRef = useRef<HTMLDivElement | null>(null);
  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

  // 将 activities 转换为展示项
  const items = useMemo<ScrollSyncItem[]>(
    () =>
      activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        subtitle: formatRelativeTime(activity.date, locale),
        image: activity.image,
        href:
          activity.type === "post"
            ? localePath(locale, `/posts/${activity.slug}`)
            : `${localePath(locale, "/gallery")}#${activity.id}`,
        type: activity.type,
      })),
    [activities, locale]
  );

  // 右侧滚动 + 同步左侧内容
  useEffect(() => {
    const rightContainer = rightRef.current;
    const leftContainer = leftRef.current;
    const leftContentWrapper = leftContentRef.current;
    if (!rightContainer || !leftContainer || !leftContentWrapper || items.length === 0) return;

    let ticking = false;

    const updateActiveItem = () => {
      const containerRect = leftContainer.getBoundingClientRect();
      const centerY = containerRect.height / 2;

      // 获取所有标题按钮
      const buttons = leftContainer.querySelectorAll("[data-item-index]");
      let closestIdx = 0;
      let minDistance = Infinity;

      buttons.forEach((btn) => {
        const idx = parseInt(btn.getAttribute("data-item-index") || "0", 10);
        const btnRect = btn.getBoundingClientRect();
        const btnCenterY = btnRect.top + btnRect.height / 2 - containerRect.top;
        const distance = Math.abs(btnCenterY - centerY);

        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }

        // 更新模糊效果
        const maxDistance = containerRect.height / 2;
        const ratio = Math.min(distance / maxDistance, 1);
        const blurValue = ratio * 6;
        const opacityValue = 1 - ratio * 0.6;

        (btn as HTMLElement).style.filter = `blur(${blurValue}px)`;
        (btn as HTMLElement).style.opacity = `${opacityValue}`;
      });

      setActive(closestIdx);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 同步左侧transform（反向缩小比例）
          const leftItemHeight = 60 + 8;
          const rightItemHeight = 400 + 24;
          const ratio = leftItemHeight / rightItemHeight;
          const translateY = -rightContainer.scrollTop * ratio;
          leftContentWrapper.style.transform = `translateY(${translateY}px)`;

          // 更新blur效果
          updateActiveItem();

          ticking = false;
        });
        ticking = true;
      }
    };

    rightContainer.addEventListener("scroll", handleScroll, { passive: true });

    // 初始化
    updateActiveItem();

    return () => {
      rightContainer.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  const scrollToIndex = (i: number) => {
    const rightContainer = rightRef.current;
    const leftContainer = leftRef.current;
    if (!rightContainer || !leftContainer) return;

    const buttons = leftContainer.querySelectorAll("[data-item-index]");
    const targetBtn = buttons[i] as HTMLElement;
    if (!targetBtn) return;

    const containerRect = leftContainer.getBoundingClientRect();
    const targetRect = targetBtn.getBoundingClientRect();
    const targetCenter = targetRect.top - containerRect.top + targetRect.height / 2;
    const containerCenter = leftContainer.clientHeight / 2;
    const leftOffset = targetCenter - containerCenter;

    // 转换为右侧的滚动距离（放大比例）
    const leftItemHeight = 60 + 8;
    const rightItemHeight = 400 + 24;
    const ratio = rightItemHeight / leftItemHeight;
    const rightOffset = leftOffset * ratio;

    // 滚动右侧容器（原生滚动）
    rightContainer.scrollBy({
      top: rightOffset,
      behavior: "smooth",
    });
  };

  // 移动端横向滚动监听
  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth * 0.9 + 16; // 90vw + gap
      const index = Math.round(scrollLeft / cardWidth);
      setMobileActiveIndex(index);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative">
      <header className="mx-auto mb-10 max-w-5xl">
        <div className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] text-zinc-400 uppercase">
            {locale === "zh" ? "最新动态" : "Latest Updates"}
          </p>
          <h1 className="text-4xl leading-tight font-bold whitespace-pre-line text-zinc-900 md:text-6xl dark:text-zinc-50">
            {heroTitle}
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">{heroSubtitle}</p>
        </div>
      </header>

      {/* 样式定义 */}
      <style>{`
        .scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }

        /* 视口渐变遮罩 - 增强边缘模糊效果 */
        .viewport-mask {
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
        }

        /* 标题容器顶部优化遮罩 - 统一渐变范围 */
        .viewport-mask-top {
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
        }

        /* 横向滚动容器边缘渐变 - 增强左右模糊 */
        .horizontal-mask {
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
        }
      `}</style>

      {/* 固定视口容器 - 桌面端双栏滚动同步 */}
      <div className="relative h-[80vh] overflow-hidden md:h-[85vh]">
        {/* Mobile: 横向滚动轮播 */}
        <div className="relative h-full md:hidden">
          {items.length > 0 ? (
            <>
              <div
                ref={mobileScrollRef}
                className="scroll-container horizontal-mask flex h-[calc(100%-3rem)] snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[5vw]"
                style={{ scrollPaddingLeft: "5vw" }}
              >
                {items.map((item, i) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative h-full w-[90vw] flex-shrink-0 snap-center overflow-hidden rounded-2xl"
                  >
                    {/* 大图背景 */}
                    <div className="relative h-full w-full">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="90vw"
                        className="object-cover transition-transform duration-500 group-active:scale-105"
                        priority={i < 3}
                      />
                    </div>

                    {/* 渐变遮罩 + 信息叠加 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute right-0 bottom-0 left-0 p-6">
                      <h3 className="text-2xl leading-tight font-bold text-white drop-shadow-lg">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-white/90 drop-shadow">{item.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 页面指示器 */}
              <div className="flex h-12 items-center justify-center gap-2">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === mobileActiveIndex
                        ? "w-8 bg-zinc-900 dark:bg-zinc-100"
                        : "w-2 bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              {locale === "zh" ? "暂无内容更新" : "No recent updates yet — stay tuned!"}
            </div>
          )}
        </div>

        {/* Desktop: 双容器布局 (原滚动同步效果) */}
        <div className="absolute inset-0 hidden gap-5 md:flex">
          {/* 左侧：通过transform同步的标题容器 */}
          <div
            ref={leftRef}
            className="scroll-container viewport-mask-top flex-1 overflow-hidden"
            style={{ paddingTop: "calc(40vh + 68px)", paddingBottom: "40vh" }}
          >
            <div ref={leftContentRef} className="space-y-2 will-change-transform">
              {items.length > 0 ? (
                items.map((item, i) => (
                  <button
                    key={item.id}
                    data-item-index={i}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-current={i === active ? "true" : "false"}
                    className="group h-[60px] w-full text-left transition-all duration-200"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xl leading-snug font-semibold tracking-tight text-zinc-900 md:text-2xl md:leading-tight dark:text-zinc-50">
                        {item.title}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {locale === "zh" ? "暂无内容更新" : "No recent updates yet — stay tuned!"}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：可滚动的图片容器 */}
          <div
            ref={rightRef}
            className="scroll-container viewport-mask flex-1 overflow-y-auto"
            style={{ paddingTop: "calc(40vh + 424px)", paddingBottom: "40vh" }}
          >
            <div ref={rightContentRef} className="space-y-6">
              {items.length > 0 ? (
                items.map((item, i) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={[
                      "block h-[400px] overflow-hidden transition-transform duration-300",
                      i === active ? "scale-[1.01]" : "scale-100",
                    ].join(" ")}
                  >
                    <div className="h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={800}
                        height={450}
                        className={[
                          "h-full w-full object-cover transition-transform duration-500 select-none",
                          i === active ? "scale-[1.02]" : "",
                        ].join(" ")}
                        draggable={false}
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500">
                  {locale === "zh"
                    ? "上传首批照片即可开启时间轴"
                    : "Add your first post or photo to populate this timeline."}
                </div>
              )}
            </div>
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
