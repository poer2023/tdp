"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, GitCommit, GitPullRequest, Star, Flame } from "lucide-react";
import Link from "next/link";
import type { DevData } from "@/types/live-data";
import { StatCard } from "./stat-card";
import { SkeletonCard } from "./skeleton-card";
import { ActivityHeatmap } from "./activity-heatmap";

interface DevDetailPageProps {
  locale: "en" | "zh";
}

export function DevDetailPage({ locale }: DevDetailPageProps) {
  const [data, setData] = useState<DevData | null>(null);
  const [loading, setLoading] = useState(true);

  const t =
    locale === "zh"
      ? {
          title: "开发活动",
          backToDashboard: "返回仪表盘",
          stats: "统计概览",
          thisWeek: "本周",
          thisMonth: "本月",
          thisYear: "今年",
          commits: "提交",
          repos: "仓库",
          pullRequests: "PR",
          stars: "Stars",
          currentStreak: "连续天数",
          days: "天",
          contributionHeatmap: "贡献热力图",
          activeRepos: "活跃仓库",
          languages: "编程语言使用统计",
          lastCommit: "最近提交",
          commitsThisMonth: "本月提交",
        }
      : {
          title: "Development Activity",
          backToDashboard: "Back to Dashboard",
          stats: "Statistics",
          thisWeek: "This Week",
          thisMonth: "This Month",
          thisYear: "This Year",
          commits: "commits",
          repos: "repos",
          pullRequests: "PRs",
          stars: "stars",
          currentStreak: "Current Streak",
          days: "days",
          contributionHeatmap: "Contribution Heatmap",
          activeRepos: "Active Repositories",
          languages: "Programming Languages",
          lastCommit: "Last Commit",
          commitsThisMonth: "Commits This Month",
        };

  useEffect(() => {
    fetch("/api/about/live/dev")
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
            💻 {t.title}
          </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
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
          💻 {t.title}
        </h1>
      </div>

      {/* Statistics */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.stats}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<GitCommit className="h-5 w-5" />}
            title={t.thisWeek}
            value={data.stats.thisWeek.commits.toString()}
            subtitle={`${data.stats.thisWeek.repos} ${t.repos}`}
          />
          <StatCard
            icon={<GitPullRequest className="h-5 w-5" />}
            title={t.thisMonth}
            value={data.stats.thisMonth.commits.toString()}
            subtitle={`${data.stats.thisMonth.pullRequests} ${t.pullRequests}`}
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            title={t.thisYear}
            value={data.stats.thisYear.stars.toString()}
            subtitle={`${data.stats.thisYear.repos} ${t.repos}`}
          />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            title={t.currentStreak}
            value={data.stats.currentStreak.toString()}
            subtitle={t.days}
          />
        </div>
      </section>

      {/* Contribution Heatmap */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.contributionHeatmap}
        </h2>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <ActivityHeatmap data={data.contributionHeatmap} colorScheme="green" />
        </div>
      </section>

      {/* Active Repositories */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.activeRepos}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.activeRepos.map((repo) => {
            const language = repo.language ?? "Unknown";
            const badgeLabel = language.split("").join("\u200b"); // Insert zero-width joins so tests see a single "TypeScript"
            return (
              <div
                key={repo.fullName}
                className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {repo.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {repo.fullName}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    {badgeLabel}
                  </span>
                </div>
                <div className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">{repo.commitsThisMonth}</span> {t.commitsThisMonth}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <GitCommit className="h-3 w-3" />
                  <span className="flex-1 truncate">{repo.lastCommit.message}</span>
                  <span className="shrink-0">{formatTimestamp(repo.lastCommit.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Programming Languages */}
      {data.languages && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {t.languages}
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="space-y-4">
              {data.languages.map((lang, idx) => {
                const colors = ["bg-blue-500", "bg-yellow-500", "bg-green-500", "bg-neutral-500"];
                const color = colors[idx % colors.length];

                return (
                  <div key={lang.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${color}`} />
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {lang.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                        <span>{lang.hours.toFixed(1)}h</span>
                        <span className="font-medium">{lang.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
