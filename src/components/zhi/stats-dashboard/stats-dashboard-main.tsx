"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { DashboardStatsData } from "@/lib/dashboard-stats";
import { NowPlayingCard, type MusicTrack } from "../now-playing-card";

// Import from extracted modules
import type { StatCardData } from "./types";
import { CodeFrequencyHeatmap } from "./code-frequency-heatmap";
import { QuickLinksCard } from "./quick-links-card";

// Skeleton component for lazy-loaded chart cards
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800 p-6 h-48">
      <div className="h-4 w-24 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
      <div className="h-32 bg-stone-200 dark:bg-stone-700 rounded" />
    </div>
  );
}

// Lazy load recharts card components to reduce initial bundle size
const ShutterCountCard = dynamic(() => import("./shutter-count-card").then(m => m.ShutterCountCard), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const WeeklyRoutineCard = dynamic(() => import("./weekly-routine-card").then(m => m.WeeklyRoutineCard), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const MediaDietCard = dynamic(() => import("./media-diet-card").then(m => m.MediaDietCard), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const DailyStepsCard = dynamic(() => import("./daily-steps-card").then(m => m.DailyStepsCard), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const LanguagesCard = dynamic(() => import("./languages-card").then(m => m.LanguagesCard), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

interface ZhiStatsDashboardProps {
  stats: DashboardStatsData;
  highlights?: StatCardData[];
}

export function ZhiStatsDashboard({
  stats,
  highlights,
}: ZhiStatsDashboardProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Life Log": "Life Log",
        subtitle: "Quantifying the hobbies that keep me sane.",
        "Shutter Count": "Shutter Count",
        "The Balance": "The Balance",
        "Weekly Routine": "Weekly Routine",
        Movies: "Movies",
        Games: "Games",
        "Now Playing": "Now Playing",
        Progress: "Progress",
        "The Journey": "The Journey",
        "Daily Steps": "Daily Steps",
        "Avg. Steps": "Avg. Steps",
        "The Output": "The Output",
        "Current Focus Areas": "Current Focus Areas",
        "View Details": "View Details",
      },
      zh: {
        "Life Log": "生活记录",
        subtitle: "量化那些让我保持理智的爱好。",
        "Shutter Count": "快门次数",
        "The Balance": "平衡",
        "Weekly Routine": "每周日程",
        Movies: "电影",
        Games: "游戏",
        "Now Playing": "正在玩",
        Progress: "进度",
        "The Journey": "旅程",
        "Daily Steps": "每日步数",
        "Avg. Steps": "平均步数",
        "The Output": "产出",
        "Current Focus Areas": "当前关注领域",
        "View Details": "查看详情",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const handleShutterClick = () => {
    setIsFlashing(true);
    setTimeout(() => {
      setAnimationTrigger((prev) => prev + 1);
    }, 100);
    setTimeout(() => {
      setIsFlashing(false);
    }, 300);
  };

  const avgSteps = Math.round(
    stats.stepsData.entries.reduce((acc: number, curr: { steps: number }) => acc + curr.steps, 0) / (stats.stepsData.entries.length || 1)
  );

  // Aggregate daily contributions for Standard Heatmap (Last 3 Months / ~90 Days)
  const heatmapData = useMemo(() => {
    if (!stats.gitHubContributions) return [];

    const dataMap = new Map((stats.gitHubContributions || []).map(i => {
      const dateStr = typeof i.date === 'string' ? i.date.split('T')[0] : new Date(i.date).toISOString().split('T')[0];
      return [dateStr, i.value];
    }));

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90);

    const dayOfWeek = startDate.getDay();
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const totalDays = 14 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(alignedStartDate);
      d.setDate(alignedStartDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;

      const isFuture = d > new Date();
      const count = isFuture ? 0 : (dataMap.get(dateStr) || 0);

      let level = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      days.push({
        date: dateStr,
        count,
        level,
        label: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [stats.gitHubContributions]);

  return (
    <div className="w-full animate-in fade-in pb-16 duration-700">
      {/* CSS Animations */}
      <style>{`
                @keyframes flash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .flash-overlay {
                    animation: flash 0.3s ease-out;
                    pointer-events: none;
                }
            `}</style>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 pt-6 sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-3 lg:gap-6 lg:px-8">
        {/* Card 1: Interactive Shutter Count */}
        <ShutterCountCard
          photoCount={stats.photoCount}
          photosByWeek={stats.photosByWeek}
          animationTrigger={animationTrigger}
          isFlashing={isFlashing}
          onShutterClick={handleShutterClick}
          t={t}
        />

        {/* Card 2: Weekly Routine */}
        <WeeklyRoutineCard routineData={stats.routineData} t={t} />

        {/* Card 2.5: Now Playing Music */}
        <div className="col-span-1">
          <NowPlayingCard
            track={stats.nowPlaying?.[0] as MusicTrack | null}
            recentTracks={(stats.nowPlaying?.slice(1) ?? []) as MusicTrack[]}
            locale={locale}
          />
        </div>

        {/* Card 3: Media Diet */}
        <MediaDietCard
          movieCount={stats.movieCount}
          movieData={stats.movieData}
          currentGame={stats.currentGame ?? null}
          t={t}
        />

        {/* Card 4: Daily Steps */}
        <DailyStepsCard stepsData={stats.stepsData} avgSteps={avgSteps} t={t} />

        {/* Card 5: Languages */}
        <LanguagesCard skillData={stats.skillData} t={t} />

        {/* Card 6: Code Frequency Heatmap */}
        {stats.gitHubContributions && stats.gitHubContributions.length > 0 && (
          <CodeFrequencyHeatmap
            heatmapData={heatmapData}
            gitHubStats={stats.gitHubStats}
            locale={locale}
          />
        )}

        {/* Quick Links */}
        {highlights && <QuickLinksCard highlights={highlights} t={t} />}
      </div>
    </div>
  );
}

export default ZhiStatsDashboard;
