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
import { useConfirm } from "@/hooks/use-confirm";
import { Surface, Button, Card, CardContent, Select } from "@/components/ui-heroui";

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
  const { confirm } = useConfirm();
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
    const confirmed = await confirm({
      title: "删除订阅",
      description: "确定要删除此订阅吗？该操作不可恢复。",
      confirmText: "删除",
      cancelText: "取消",
      variant: "danger",
    });
    if (!confirmed) return;

    startTransition(async () => {
      const response = await fetch(`/api/subscriptions/${record.id}`, {
        method: "DELETE",
      });

      if (!response || !response.ok) {
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
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {translation("subscriptions")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {translation("subscriptionOverview")}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("subscriptionDescription")}
            </p>
          </div>
          <Button asChild color="primary">
            <Link href="/admin/subscriptions/new">{translation("addSubscription")}</Link>
          </Button>
        </div>
      </Surface>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={translation("monthlySpend")} value={formatCNY(totals.monthly)} />
        <SummaryCard label={translation("annualSpend")} value={formatCNY(totals.annual)} />
        <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {translation("markdownExport")}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("markdownExportDescription")}
            </p>
            <Button
              color="secondary"
              onPress={handleExport}
              isDisabled={isExporting || items.length === 0}
            >
              {isExporting ? `${translation("markdownExport")}...` : translation("downloadMarkdown")}
            </Button>
          </CardContent>
        </Card>
        <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {translation("subscriptionManagement")}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("createNewSubscription")}
            </p>
            <Button asChild variant="light">
              <Link href="/admin/subscriptions/new">{translation("addSubscription")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {translation("subscriptionList")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translation("filterByCycle")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label={translation("billingCycle")}
              value={cycleFilter}
              onChange={(value) =>
                setCycleFilter(value === "ALL" ? "ALL" : (value as BillingCycle))
              }
            >
              <Select.Item id="ALL">All</Select.Item>
              {billingCycleOptions.map((option) => (
                <Select.Item key={option.value} id={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                {translation("chartTrend")}
              </p>
              <div className="flex gap-2">
                {(["MONTHLY", "ANNUAL"] as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "solid" : "light"}
                    onPress={() => setViewMode(mode)}
                    className="flex-1"
                  >
                    {mode === "MONTHLY" ? translation("monthlyView") : translation("annualView")}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <SubscriptionPieChart data={barChartData} viewMode={viewMode} locale={locale} />
        <StatsCard
          title={translation("chartTrend")}
          currentValue={currentMonthValue}
          valuePrefix="¥"
          description={translation("trendDescription")}
          chartData={statsChartData}
        />
      </section>

      {filteredItems.length === 0 ? (
        <Card
          variant="secondary"
          className="border border-dashed border-zinc-300 text-center dark:border-zinc-700"
        >
          <CardContent className="py-10 text-sm text-zinc-500 dark:text-zinc-400">
            {translation("createFirstSubscription")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((subscription) => (
            <SubscriptionExpandableCard
              key={subscription.id}
              subscription={subscription}
              locale={locale}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      </CardContent>
    </Card>
  );
}
