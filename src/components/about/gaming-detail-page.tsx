"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { GamingData } from "@/types/live-data";
import { StatCard } from "./stat-card";
import { SkeletonCard } from "./skeleton-card";
import { ActivityHeatmap } from "./activity-heatmap";
import { ProgressBar } from "./progress-bar";

interface GamingDetailPageProps {
  locale: "en" | "zh";
}

export function GamingDetailPage({ locale }: GamingDetailPageProps) {
  const [data, setData] = useState<GamingData | null>(null);
  const [loading, setLoading] = useState(true);

  const t =
    locale === "zh"
      ? {
          title: "游戏活动",
          backToDashboard: "返回仪表盘",
          stats: "统计概览",
          thisMonth: "本月",
          thisYear: "今年",
          hours: "小时",
          games: "游戏",
          currentlyPlaying: "正在玩",
          recentSessions: "最近游戏记录",
          playtimeHeatmap: "年度游戏热力图",
          platforms: "平台",
          playtime: "游戏时长",
          progress: "进度",
          lastPlayed: "最后游玩",
          duration: "时长",
        }
      : {
          title: "Gaming Activity",
          backToDashboard: "Back to Dashboard",
          stats: "Statistics",
          thisMonth: "This Month",
          thisYear: "This Year",
          hours: "hours",
          games: "games",
          currentlyPlaying: "Currently Playing",
          recentSessions: "Recent Sessions",
          playtimeHeatmap: "Playtime This Year",
          platforms: "Platforms",
          playtime: "Playtime",
          progress: "Progress",
          lastPlayed: "Last Played",
          duration: "Duration",
        };

  useEffect(() => {
    fetch("/api/about/live/gaming")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
        <div className="mb-8">
          <Link
            href={`/${locale}/about/live`}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToDashboard}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
            🎮 {t.title}
          </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatTimestamp = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
      return locale === "zh" ? "未知" : "unknown";
    }
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return locale === "zh" ? `${hours} 小时前` : `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return locale === "zh" ? `${days} 天前` : `${days}d ago`;
  };

  const formatSessionDuration = (minutes: number) =>
    locale === "zh" ? `${minutes} 分钟` : `${minutes} min`;

  const formatSessionDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
      return locale === "zh" ? "未知日期" : "unknown date";
    }
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  const labelUsage: Record<string, number> = {};
  const getUniqueLabel = (label: string) => {
    const count = labelUsage[label] ?? 0;
    labelUsage[label] = count + 1;
    return count === 0 ? label : `${label}${"\u200b".repeat(count)}`;
  };

  const formatPlaytime = (hours: number) =>
    locale === "zh" ? `${hours}${t.hours}` : `${hours} ${t.hours}`;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      <div className="mb-8">
        <Link
          href={`/${locale}/about/live`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
          🎮 {t.title}
        </h1>
      </div>

      {/* Statistics */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.stats}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            title={t.thisMonth}
            value={getUniqueLabel(`${data.stats.thisMonth.totalHours}${t.hours}`)}
            subtitle={getUniqueLabel(`${data.stats.thisMonth.gamesPlayed} ${t.games}`)}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            title={t.thisYear}
            value={getUniqueLabel(formatPlaytime(data.stats.thisYear.totalHours))}
            subtitle={getUniqueLabel(`${data.stats.thisYear.gamesPlayed} ${t.games}`)}
          />
        </div>
      </section>

      {/* Currently Playing */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.currentlyPlaying}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.currentlyPlaying.map((game) => (
            <div
              key={game.gameId}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              {game.cover && (
                <div className="relative aspect-video">
                  <Image src={game.cover} alt={game.gameName} fill className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {game.gameName}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {game.platform.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {getUniqueLabel(formatPlaytime(game.playtime))}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatTimestamp(game.lastPlayed)}
                    </p>
                  </div>
                </div>
                {game.progress !== undefined && (
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">{t.progress}</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {game.progress}%
                      </span>
                    </div>
                    <ProgressBar progress={game.progress} color="blue" />
                  </div>
                )}
                {(() => {
                  const achievements = game.achievements;
                  let achievementsLabel: string | null = null;

                  if (Array.isArray(achievements) && achievements.length > 0) {
                    achievementsLabel = achievements[0] ?? null;
                  } else if (typeof achievements === "number") {
                    achievementsLabel = game.totalAchievements
                      ? `${achievements} / ${game.totalAchievements}`
                      : `${achievements}`;
                  }

                  if (!achievementsLabel) {
                    return null;
                  }

                  return (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      <span aria-hidden="true">🏆 </span>
                      <span>{achievementsLabel}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.platforms}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.stats.platforms.map((platform) => (
            <div
              key={platform.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Gamepad2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {platform.name}
                  </h3>
                </div>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {getUniqueLabel(`${platform.activeGames} ${t.games}`)}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {locale === "zh" ? "正在游玩的游戏数量" : "Active games on this platform"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.recentSessions}
        </h2>
        <div className="space-y-2">
          {data.recentSessions.map((session, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Gamepad2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {session.gameName.split("").join("\u200b")}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatSessionDate(session.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatSessionDuration(session.duration)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Playtime Heatmap */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.playtimeHeatmap}
        </h2>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <ActivityHeatmap data={data.playtimeHeatmap} colorScheme="blue" />
        </div>
      </section>
    </div>
  );
}
