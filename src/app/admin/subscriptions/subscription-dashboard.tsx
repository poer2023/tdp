"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminTranslations } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { formatCNY, formatOriginalCurrency, SUPPORTED_CURRENCIES } from "@/lib/subscription-shared";

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

type FormState = {
  id: string | null;
  name: string;
  currency: string;
  amount: string;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  notes: string;
};

const billingCycleOptions: { value: BillingCycle; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "ONE_TIME", label: "One-time" },
];

const INITIAL_FORM: FormState = {
  id: null,
  name: "",
  currency: "CNY",
  amount: "",
  billingCycle: "MONTHLY",
  startDate: "",
  endDate: "",
  notes: "",
};

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
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [viewMode, setViewMode] = useState<ViewMode>("MONTHLY");
  const [cycleFilter, setCycleFilter] = useState<BillingCycle | "ALL">("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const maxBarValue = useMemo(() => {
    if (barChartData.length === 0) return 1;
    return Math.max(...barChartData.map((entry) => entry.value), 1);
  }, [barChartData]);

  const maxLineValue = useMemo(() => {
    if (monthlyTotals.length === 0) return 1;
    return Math.max(...monthlyTotals.map((entry) => entry.value), 1);
  }, [monthlyTotals]);

  const linePathData = useMemo(() => {
    if (monthlyTotals.length === 0) {
      return {
        path: "",
        area: "",
        points: [] as { x: number; y: number; label: string; value: number }[],
      };
    }

    const width = 400;
    const baseline = 140;

    const coordinates = monthlyTotals.map((entry, index) => {
      const x =
        monthlyTotals.length === 1 ? width / 2 : (index / (monthlyTotals.length - 1)) * width;
      const ratio = maxLineValue === 0 ? 0 : entry.value / maxLineValue;
      const y = baseline - ratio * 120;
      return { x, y, label: entry.label, value: entry.value };
    });

    const path = coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const area =
      `${coordinates.length ? `M ${coordinates[0].x} ${baseline}` : ""} ` +
      coordinates.map((point) => `L ${point.x} ${point.y}`).join(" ") +
      (coordinates.length ? ` L ${coordinates[coordinates.length - 1].x} ${baseline} Z` : "");

    return { path, area, points: coordinates };
  }, [monthlyTotals, maxLineValue]);

  const translation = (key: keyof typeof adminTranslations.en) => translate(locale, key);

  const isEditing = Boolean(form.id);

  const handleEdit = (record: SubscriptionRecord) => {
    setForm({
      id: record.id,
      name: record.name,
      currency: record.currency,
      amount: record.amount.toString(),
      billingCycle: record.billingCycle,
      startDate: record.startDate.slice(0, 10),
      endDate: record.endDate ? record.endDate.slice(0, 10) : "",
      notes: record.notes ?? "",
    });
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setError(null);
  };

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
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete subscription.");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== record.id));
      router.refresh();
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      currency: form.currency,
      amount: form.amount,
      billingCycle: form.billingCycle,
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes,
    };

    if (!payload.name || !payload.amount || !payload.startDate) {
      setError("Please complete all required fields.");
      return;
    }

    startTransition(async () => {
      const endpoint = form.id ? `/api/subscriptions/${form.id}` : "/api/subscriptions";
      const method = form.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Failed to save subscription.");
        return;
      }

      const data = await response.json();
      const saved: SubscriptionRecord = data.subscription;

      setItems((previous) => {
        const existing = previous.findIndex((item) => item.id === saved.id);
        if (existing >= 0) {
          const next = [...previous];
          next[existing] = saved;
          return next;
        }
        return [saved, ...previous];
      });
      resetForm();
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

      <section>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {isEditing ? translation("editSubscription") : translation("addSubscription")}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {translation("subscriptionManagement")}
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {translation("newSubscription")}
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("subscriptionName")}
              </span>
              <input
                required
                name="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
                placeholder="Netflix, GitHub, Adobe..."
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("billingCycle")}
              </span>
              <select
                name="billingCycle"
                value={form.billingCycle}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    billingCycle: event.target.value as BillingCycle,
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
              >
                {billingCycleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("currency")}
              </span>
              <select
                name="currency"
                value={form.currency}
                onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("originalAmount")}
              </span>
              <input
                required
                name="amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
                placeholder="0.00"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("startDate")}
              </span>
              <input
                required
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {translation("endDate")}
              </span>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {translation("notes")}
            </span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
              rows={3}
              placeholder="Remarks, renewal reminders, account info..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting ? `${translation("saveChanges")}...` : translation("saveChanges")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {translation("cancel")}
            </button>
          </div>
        </form>
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
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {translation("chartSubscriptions")}
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{viewMode}</span>
            </div>
            <div className="mt-4 h-48">
              {barChartData.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {translation("noSubscriptions")}
                </p>
              ) : (
                <div className="flex h-full items-end gap-2">
                  {barChartData.map((entry) => {
                    const height = Math.max((entry.value / maxBarValue) * 100, 5);
                    return (
                      <div key={entry.id} className="flex-1">
                        <div
                          className="relative flex h-full items-end justify-center rounded-md bg-gradient-to-t from-blue-100 to-blue-500 text-sm font-semibold text-white dark:from-blue-900 dark:to-blue-500"
                          style={{ height: `${height}%` }}
                        >
                          <span className="absolute -top-6 text-xs text-zinc-700 dark:text-zinc-200">
                            {formatCNY(entry.value)}
                          </span>
                        </div>
                        <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
                          {entry.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {translation("chartTrend")}
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">¥</span>
            </div>
            <div className="mt-4 h-48">
              {monthlyTotals.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {translation("noSubscriptions")}
                </p>
              ) : (
                <svg viewBox="0 0 400 160" className="h-full w-full">
                  <defs>
                    <linearGradient id="subscriptionLine" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {linePathData.area && (
                    <path d={linePathData.area} fill="url(#subscriptionLine)" />
                  )}
                  {linePathData.path && (
                    <path
                      d={linePathData.path}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}
                  {linePathData.points.map((point) => (
                    <g key={point.label}>
                      <circle cx={point.x} cy={point.y} r={4} fill="#1d4ed8" />
                      <text
                        x={point.x}
                        y={point.y - 10}
                        textAnchor="middle"
                        className="fill-zinc-600 text-xs dark:fill-zinc-300"
                      >
                        {formatCNY(point.value)}
                      </text>
                      <text
                        x={point.x}
                        y={150}
                        textAnchor="middle"
                        className="fill-zinc-500 text-xs dark:fill-zinc-400"
                      >
                        {point.label}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>
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
            <article
              key={subscription.id}
              className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {subscription.name}
                </h3>
                <p className="mt-1 text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {
                    billingCycleOptions.find((option) => option.value === subscription.billingCycle)
                      ?.label
                  }
                </p>
              </header>

              <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <p className="flex items-center justify-between">
                  <span>{translation("originalAmount")}</span>
                  <span>{formatOriginalCurrency(subscription.amount, subscription.currency)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{translation("convertedAmount")}</span>
                  <span>{formatCNY(subscription.amountCNY)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{translation("monthlyView")}</span>
                  <span>{formatCNY(computeMonthlyValue(subscription))}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{translation("annualView")}</span>
                  <span>{formatCNY(computeAnnualValue(subscription))}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{translation("startDate")}</span>
                  <span>{subscription.startDate.slice(0, 10)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{translation("endDate")}</span>
                  <span>{subscription.endDate ? subscription.endDate.slice(0, 10) : "-"}</span>
                </p>
                {subscription.notes && (
                  <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {subscription.notes}
                  </p>
                )}
              </div>

              <footer className="mt-4 flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => handleEdit(subscription)}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-500 px-3 py-1.5 text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  {translation("editSubscription")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(subscription)}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-500 px-3 py-1.5 text-rose-600 transition hover:bg-rose-50 dark:border-rose-400 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  {translation("deleteSubscription")}
                </button>
              </footer>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
