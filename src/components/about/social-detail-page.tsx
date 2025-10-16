"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Phone, Users, Shield } from "lucide-react";
import Link from "next/link";
import type { SocialData } from "@/types/live-data";
import { StatCard } from "./stat-card";
import { SkeletonCard } from "./skeleton-card";

interface SocialDetailPageProps {
  locale: "en" | "zh";
}

export function SocialDetailPage({ locale }: SocialDetailPageProps) {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);

  const t =
    locale === "zh"
      ? {
          title: "社交活动",
          backToDashboard: "返回仪表盘",
          privacyNotice: "隐私保护",
          privacyDescription: "所有数据已完全匿名化处理,仅展示统计信息",
          stats: "统计概览",
          thisWeek: "本周",
          thisMonth: "本月",
          conversations: "对话",
          calls: "通话",
          activePeople: "活跃联系人",
          activeGroups: "活跃群组",
          platformDistribution: "平台分布",
          recentActivity: "最近活动",
          chat: "对话",
          call: "通话",
          group: "群组",
          minutes: "分钟",
        }
      : {
          title: "Social Activity",
          backToDashboard: "Back to Dashboard",
          privacyNotice: "Privacy Protected",
          privacyDescription: "All data is fully anonymized, showing aggregated statistics only",
          stats: "Statistics",
          thisWeek: "This Week",
          thisMonth: "This Month",
          conversations: "conversations",
          calls: "calls",
          activePeople: "Active Contacts",
          activeGroups: "Active Groups",
          platformDistribution: "Platform Distribution",
          recentActivity: "Recent Activity",
          chat: "Chat",
          call: "Call",
          group: "Group",
          minutes: "min",
        };

  useEffect(() => {
    fetch("/api/about/live/social")
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
            💬 {t.title}
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-5 w-5" />;
      case "group":
        return <Users className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "call":
        return t.call;
      case "group":
        return t.group;
      default:
        return t.chat;
    }
  };

  // Calculate platform percentages
  const totalInteractions = Object.values(data.platformStats).reduce((a, b) => a + b, 0);
  const platformPercentages = Object.entries(data.platformStats).map(([platform, count]) => ({
    platform,
    count,
    percentage: Math.round((count / totalInteractions) * 100),
  }));

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
          💬 {t.title}
        </h1>
      </div>

      {/* Privacy Notice */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/10">
        <Shield className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="font-semibold text-green-900 dark:text-green-100">{t.privacyNotice}</h3>
          <p className="text-sm text-green-700 dark:text-green-300">{t.privacyDescription}</p>
        </div>
      </div>

      {/* Statistics */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.stats}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<MessageCircle className="h-5 w-5" />}
            title={t.thisWeek}
            value={data.stats.thisWeek.conversations.toString()}
            subtitle={t.conversations}
          />
          <StatCard
            icon={<Phone className="h-5 w-5" />}
            title={t.thisWeek}
            value={data.stats.thisWeek.calls.toString()}
            subtitle={t.calls}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            title={t.activePeople}
            value={data.stats.activePeople.toString()}
            subtitle={t.thisMonth}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            title={t.activeGroups}
            value={data.stats.activeGroups.toString()}
            subtitle={t.thisMonth}
          />
        </div>
      </section>

      {/* Platform Distribution */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.platformDistribution}
        </h2>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="space-y-4">
            {platformPercentages.map((item, idx) => {
              const colors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-yellow-500"];
              const color = colors[idx % colors.length];

              return (
                <div key={item.platform}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${color}`} />
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {item.platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                      <span>
                        {item.count} {t.conversations}
                      </span>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className={`h-full ${color} transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Activity (Anonymized) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.recentActivity}
        </h2>
        <div className="space-y-2">
          {data.recentInteractions.map((interaction, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  {getTypeIcon(interaction.type)}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {getTypeLabel(interaction.type)}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {interaction.platform}
                    {interaction.duration && ` • ${interaction.duration} ${t.minutes}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatTimestamp(interaction.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
