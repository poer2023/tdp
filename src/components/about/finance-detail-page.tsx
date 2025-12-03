"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, PieChart, CreditCard, Shield, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { FinanceData } from "@/types/live-data";
import { SkeletonCard } from "./skeleton-card";
import { localePath } from "@/lib/locale-path";

interface FinanceDetailPageProps {
  locale: "en" | "zh";
}

export function FinanceDetailPage({ locale }: FinanceDetailPageProps) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const t =
    locale === "zh"
      ? {
          title: "财务概览",
          backToDashboard: "返回仪表盘",
          privacyNotice: "隐私保护",
          privacyDescription: "所有金额已归一化处理,仅展示相对趋势和百分比",
          monthlyTrend: "月度支出趋势",
          categoryDistribution: "支出类别分布",
          subscriptions: "订阅",
          insights: "洞察",
          renewalDate: "续费日期",
          months: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
          ],
        }
      : {
          title: "Finance Overview",
          backToDashboard: "Back to Dashboard",
          privacyNotice: "Privacy Protected",
          privacyDescription:
            "All amounts are normalized, showing relative trends and percentages only",
          monthlyTrend: "Monthly Spending Trend",
          categoryDistribution: "Spending by Category",
          subscriptions: "Subscriptions",
          insights: "Insights",
          renewalDate: "Renewal",
          months: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
        };

  useEffect(() => {
    fetch("/api/about/live/finance")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (process.env.NODE_ENV === "test") {
    console.log("Finance subscriptions label", t.subscriptions);
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
        <div className="mb-8">
          <Link
            href={localePath(locale, "/about/live")}
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToDashboard}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-stone-900 sm:text-4xl dark:text-stone-100">
            💰 {t.title}
          </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDate = (date?: Date | string) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const maxTrend = Math.max(...data.monthlyTrend);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      <div className="mb-8">
        <Link
          href={localePath(locale, "/about/live")}
          className="inline-flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-stone-900 sm:text-4xl dark:text-stone-100">
          💰 {t.title}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t.monthlyTrend}
              </h2>
            </div>
            <div className="flex h-48 items-end gap-2">
              {data.monthlyTrend.map((value, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end justify-center">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${(value / maxTrend) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {t.months[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category Distribution */}
        <section>
          <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t.categoryDistribution}
              </h2>
            </div>
            <div className="space-y-4">
              {data.categories.map((category, idx) => {
                const colors = [
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-yellow-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-stone-500",
                ];
                const color = colors[idx % colors.length];

                return (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${color}`} />
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {category.name}
                        </span>
                      </div>
                      <span className="font-medium text-stone-600 dark:text-stone-400">
                        {category.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Subscriptions */}
        <section>
          <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t.subscriptions}
              </h2>
            </div>
            <div className="space-y-3">
              {data.subscriptions.map((sub) => (
                <div
                  key={sub.name}
                  className="flex items-center justify-between rounded-lg border border-stone-200 p-3 dark:border-stone-800"
                >
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">{sub.name}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {sub.amount}
                    </p>
                    {sub.renewalDate && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(sub.renewalDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t.insights}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50"
                >
                  <p className="text-sm text-stone-700 dark:text-stone-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
