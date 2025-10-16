"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminTranslations } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { formatCNY, formatOriginalCurrency } from "@/lib/subscription-shared";
import { SubscriptionPieChart } from "@/components/subscriptions/subscription-pie-chart";
import { SubscriptionExpandableCard } from "@/components/subscriptions/subscription-expandable-card";
import { StatsCard } from "@/components/ui/stats-card";
import type { ChartDataItem } from "@/components/ui/stats-card";

type BillingCycle = "MONTHLY" | "ANNUAL" | "ONE_TIME";

type SubscriptionRecord = {
  id: string;
  userId: string;
  name: string;
  currency: string;
  amount: number;
  amountCNY: number;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  notes: string;
  originalRateToCNY: number | null;
  createdAt: string;
  updatedAt: string;
};

const billingCycleOptions: { value: BillingCycle; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "ONE_TIME", label: "One-time" },
];

function translate(locale: AdminLocale, key: keyof typeof adminTranslations.en) {
  return adminTranslations[locale][key];
}

type ViewMode = "MONTHLY" | "ANNUAL";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isMonthWithin(subscription: SubscriptionRecord, month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const start = new Date(subscription.startDate);
  const end = subscription.endDate ? new Date(subscription.endDate) : null;

  if (start > monthEnd) {
    return false;
  }

  if (end && end < monthStart) {
    return false;
  }

  return true;
}

function computeMonthlyContribution(subscription: SubscriptionRecord, month: Date) {
  if (!isMonthWithin(subscription, month)) {
    return 0;
  }

  switch (subscription.billingCycle) {
    case "MONTHLY":
      return subscription.amountCNY;
    case "ANNUAL":
      return Number((subscription.amountCNY / 12).toFixed(2));
    case "ONE_TIME": {
      const start = new Date(subscription.startDate);
      if (start.getFullYear() === month.getFullYear() && start.getMonth() === month.getMonth()) {
        return subscription.amountCNY;
      }
      return 0;
    }
    default:
      return 0;
  }
}

function computeMonthlyValue(subscription: SubscriptionRecord) {
  switch (subscription.billingCycle) {
    case "MONTHLY":
      return subscription.amountCNY;
    case "ANNUAL":
      return Number((subscription.amountCNY / 12).toFixed(2));
    case "ONE_TIME":
      return Number((subscription.amountCNY / 12).toFixed(2));
    default:
      return subscription.amountCNY;
  }
}

function computeAnnualValue(subscription: SubscriptionRecord) {
  switch (subscription.billingCycle) {
    case "MONTHLY":
      return Number((subscription.amountCNY * 12).toFixed(2));
    case "ANNUAL":
      return subscription.amountCNY;
    case "ONE_TIME":
      return subscription.amountCNY;
    default:
      return subscription.amountCNY;
  }
}

type SubscriptionDashboardProps = {
  locale: AdminLocale;
  initialSubscriptions: SubscriptionRecord[];
};

export default function SubscriptionDashboard({
  locale,
  initialSubscriptions,
}: SubscriptionDashboardProps) {
  const router = useRouter();
  const [items, setItems] = useState<SubscriptionRecord[]>(initialSubscriptions);
  const [viewMode, setViewMode] = useState<ViewMode>("MONTHLY");
  const [cycleFilter, setCycleFilter] = useState<BillingCycle | "ALL">("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    if (cycleFilter === "ALL") {
      return items;
    }
    return items.filter((item) => item.billingCycle === cycleFilter);
  }, [items, cycleFilter]);

  const totals = useMemo(() => {
    const monthly = filteredItems.reduce((acc, subscription) => {
      return acc + computeMonthlyValue(subscription);
    }, 0);

    const annual = filteredItems.reduce((acc, subscription) => {
      return acc + computeAnnualValue(subscription);
    }, 0);

    return {
      monthly: Number(monthly.toFixed(2)),
      annual: Number(annual.toFixed(2)),
    };
  }, [filteredItems]);

  const barChartData = useMemo(() => {
    return filteredItems.map((subscription) => {
      const value =
        viewMode === "MONTHLY"
          ? computeMonthlyValue(subscription)
          : computeAnnualValue(subscription);
      return {
        id: subscription.id,
        name: subscription.name,
        value,
        currencyValue:
          viewMode === "MONTHLY"
            ? translate(locale, "monthlyTotal")
            : translate(locale, "annualTotal"),
      };
    });
  }, [filteredItems, viewMode, locale]);

  const monthlyTotals = useMemo(() => {
    const now = startOfMonth(new Date());
    const labels: { label: string; value: number }[] = [];

    for (let i = 11; i >= 0; i -= 1) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - i);

      const value = filteredItems.reduce((acc, subscription) => {
        return acc + computeMonthlyContribution(subscription, monthDate);
      }, 0);

      labels.push({
        label: new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
          month: "short",
        }).format(monthDate),
        value: Number(value.toFixed(2)),
      });
    }

    return labels;
  }, [filteredItems, locale]);

  const maxLineValue = useMemo(() => {
    if (monthlyTotals.length === 0) return 1;
    return Math.max(...monthlyTotals.map((entry) => entry.value), 1);
  }, [monthlyTotals]);

  const statsChartData = useMemo((): ChartDataItem[] => {
    return monthlyTotals.map((entry, index) => ({
      name: entry.label,
      value: maxLineValue === 0 ? 0 : (entry.value / maxLineValue) * 100,
      actualValue: entry.value,
      color: index === monthlyTotals.length - 1 ? "bg-blue-500" : undefined,
    }));
  }, [monthlyTotals, maxLineValue]);

  const currentMonthValue = useMemo(() => {
    if (monthlyTotals.length === 0) return 0;
    return monthlyTotals[monthlyTotals.length - 1]?.value ?? 0;
  }, [monthlyTotals]);

  const translation = (key: keyof typeof adminTranslations.en) => translate(locale, key);

  const handleDelete = async (record: SubscriptionRecord) => {
    const confirmed = window.confirm(
      `${translation("confirmDelete")}\n${translation("confirmDeleteDescription")}`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const response = await fetch(`/api/subscriptions/${record.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== record.id));
      router.refresh();
    });
  };

  const handleExport = () => {
    setIsExporting(true);

    try {
      const lines: string[] = [];
      lines.push(`# ${translation("subscriptionOverview")}`);
      lines.push("");
      lines.push(`- ${translation("monthlySpend")}: ${formatCNY(totals.monthly)}`);
      lines.push(`- ${translation("annualSpend")}: ${formatCNY(totals.annual)}`);
      lines.push("");
      lines.push(`## ${translation("subscriptionList")}`);
      lines.push("");
      lines.push(
        `| ${translation("subscriptionName")} | ${translation("billingCycle")} | ${translation(
          "originalAmount"
        )} | ${translation("convertedAmount")} | ${translation("startDate")} | ${translation(
          "endDate"
        )} |`
      );
      lines.push("| --- | --- | --- | --- | --- | --- |");

      items.forEach((subscription) => {
        const cycleLabel =
          billingCycleOptions.find((option) => option.value === subscription.billingCycle)?.label ??
          subscription.billingCycle;
        const originalAmount = formatOriginalCurrency(subscription.amount, subscription.currency);
        const converted = formatCNY(subscription.amountCNY);
        const start = subscription.startDate.slice(0, 10);
        const end = subscription.endDate ? subscription.endDate.slice(0, 10) : "-";

        lines.push(
          `| ${subscription.name} | ${cycleLabel} | ${originalAmount} | ${converted} | ${start} | ${end} |`
        );
      });

      lines.push("");
      lines.push(`## ${translation("chartTrend")}`);
      lines.push("");
      lines.push("| Month | Total (CNY) |");
      lines.push("| --- | --- |");
      monthlyTotals.forEach((entry) => {
        lines.push(`| ${entry.label} | ${formatCNY(entry.value)} |`);
      });

      const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <header className="space-y-2">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">
          {translation("subscriptions")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {translation("subscriptionOverview")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {translation("subscriptionDescription")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{translation("monthlySpend")}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatCNY(totals.monthly)}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{translation("annualSpend")}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatCNY(totals.annual)}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {translation("markdownExport")}
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || items.length === 0}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isExporting ? `${translation("markdownExport")}...` : translation("downloadMarkdown")}
          </button>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {translation("markdownExportDescription")}
          </p>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {translation("subscriptionManagement")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {translation("createNewSubscription")}
          </p>
        </div>
        <Link
          href="/admin/subscriptions/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          {translation("addSubscription")}
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {translation("subscriptionList")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("filterByCycle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cycleFilter}
              onChange={(event) =>
                setCycleFilter(
                  event.target.value === "ALL" ? "ALL" : (event.target.value as BillingCycle)
                )
              }
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
            >
              <option value="ALL">All</option>
              {billingCycleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setViewMode("MONTHLY")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  viewMode === "MONTHLY"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {translation("monthlyView")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ANNUAL")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  viewMode === "ANNUAL"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {translation("annualView")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SubscriptionPieChart data={barChartData} viewMode={viewMode} locale={locale} />

          <StatsCard
            title={translation("chartTrend")}
            currentValue={currentMonthValue}
            valuePrefix="¥"
            description={translation("trendDescription")}
            chartData={statsChartData}
            defaultBarColor="bg-zinc-200 dark:bg-zinc-700"
            highlightedBarColor="bg-blue-500"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("createFirstSubscription")}
            </p>
          </div>
        ) : (
          filteredItems.map((subscription) => (
            <SubscriptionExpandableCard
              key={subscription.id}
              subscription={subscription}
              locale={locale}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>
    </div>
  );
}
