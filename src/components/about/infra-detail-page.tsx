"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import type { InfraData } from "@/types/live-data";
import { ServerStatusCard } from "./server-status-card";
import { ServiceStatusCard } from "./service-status-card";
import { SkeletonGrid } from "./skeleton-card";

interface InfraDetailPageProps {
  locale: "en" | "zh";
}

export function InfraDetailPage({ locale }: InfraDetailPageProps) {
  const [data, setData] = useState<InfraData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/about/live/infra")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch infrastructure data:", error);
        setLoading(false);
      });
  }, []);

  const t =
    locale === "zh"
      ? {
          title: "基础设施仪表盘",
          backToDashboard: "返回仪表盘",
          serversOverview: "服务器概览",
          selfHostedServices: "自建服务",
          networkTraffic: "网络流量",
          recentEvents: "最近事件",
          loading: "加载中...",
          noData: "暂无数据",
          last24Hours: "最近 24 小时",
          inbound: "入站",
          outbound: "出站",
        }
      : {
          title: "Infrastructure Dashboard",
          backToDashboard: "Back to Dashboard",
          serversOverview: "Servers Overview",
          selfHostedServices: "Self-Hosted Services",
          networkTraffic: "Network Traffic",
          recentEvents: "Recent Events",
          loading: "Loading...",
          noData: "No data available",
          last24Hours: "Last 24 Hours",
          inbound: "Inbound",
          outbound: "Outbound",
        };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return locale === "zh" ? "刚刚" : "Just now";
    if (hours < 24) return locale === "zh" ? `${hours}小时前` : `${hours}h ago`;
    if (days < 7) return locale === "zh" ? `${days}天前` : `${days}d ago`;
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const eventIcons = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/about/live`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
          🖥️ {t.title}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-8">
          <SkeletonGrid count={3} />
          <SkeletonGrid count={4} />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Servers Overview */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.serversOverview}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.servers.map((server) => (
                <ServerStatusCard key={server.id} server={server} />
              ))}
            </div>
          </section>

          {/* Self-Hosted Services */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.selfHostedServices}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.services.map((service) => (
                <ServiceStatusCard key={service.id} service={service} />
              ))}
            </div>
          </section>

          {/* Network Traffic */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.networkTraffic}
            </h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
                <Activity className="h-4 w-4" />
                <span>{t.last24Hours}</span>
              </div>
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="grid grid-cols-24 gap-1">
                  {data.networkTraffic.map((traffic, idx) => {
                    const maxTraffic = Math.max(
                      ...data.networkTraffic.map((t) => t.inbound + t.outbound)
                    );
                    const height = ((traffic.inbound + traffic.outbound) / maxTraffic) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col justify-end"
                        style={{ height: "120px" }}
                      >
                        <div
                          className="w-full rounded-t-sm bg-blue-500 dark:bg-blue-600"
                          style={{ height: `${height}%` }}
                          title={`${traffic.inbound.toFixed(2)} GB in, ${traffic.outbound.toFixed(2)} GB out`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>24h ago</span>
                  <span>Now</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">Total Traffic</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Events */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.recentEvents}
            </h2>
            <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              {data.events.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">{t.noData}</p>
              ) : (
                data.events.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span className="text-lg">{eventIcons[event.type]}</span>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">
                        {event.message}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
