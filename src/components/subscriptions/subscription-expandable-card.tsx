"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useExpandable } from "@/components/hooks/use-expandable";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCNY, formatOriginalCurrency } from "@/lib/subscription-shared";
import { adminTranslations } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { useConfirm } from "@/hooks/use-confirm";

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

type SubscriptionExpandableCardProps = {
  subscription: SubscriptionRecord;
  locale: AdminLocale;
  onDelete: (subscription: SubscriptionRecord) => void;
};

function translate(locale: AdminLocale, key: keyof typeof adminTranslations.en) {
  return adminTranslations[locale][key];
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

function calculateProgress(subscription: SubscriptionRecord): number {
  if (!subscription.endDate) {
    return 0;
  }

  const start = new Date(subscription.startDate).getTime();
  const end = new Date(subscription.endDate).getTime();
  const now = Date.now();

  if (now < start) return 0;
  if (now > end) return 100;

  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
}

function getBadgeVariant(cycle: BillingCycle): "default" | "secondary" | "outline" {
  switch (cycle) {
    case "MONTHLY":
      return "default";
    case "ANNUAL":
      return "secondary";
    case "ONE_TIME":
      return "outline";
    default:
      return "default";
  }
}

export function SubscriptionExpandableCard({
  subscription,
  locale,
  onDelete,
}: SubscriptionExpandableCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable(false);
  const { confirm } = useConfirm();
  const contentRef = useRef<HTMLDivElement>(null);

  const progress = calculateProgress(subscription);
  const monthlyValue = computeMonthlyValue(subscription);
  const annualValue = computeAnnualValue(subscription);

  const billingCycleLabel =
    subscription.billingCycle === "MONTHLY"
      ? "Monthly"
      : subscription.billingCycle === "ANNUAL"
        ? "Annual"
        : "One-time";

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={toggleExpand}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="text-lg leading-none font-semibold tracking-tight">
              {subscription.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {subscription.endDate
                ? `${translate(locale, "endDate")}: ${subscription.endDate.slice(0, 10)}`
                : translate(locale, "noEndDate")}
            </p>
          </div>
          <Badge variant={getBadgeVariant(subscription.billingCycle)}>{billingCycleLabel}</Badge>
        </div>

        {subscription.endDate && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {translate(locale, "progress")}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {translate(locale, "monthlyView")}
            </p>
            <p className="font-semibold">{formatCNY(monthlyValue)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {translate(locale, "annualView")}
            </p>
            <p className="font-semibold">{formatCNY(annualValue)}</p>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <CardContent ref={contentRef} className="space-y-3 pt-0">
              <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {translate(locale, "originalAmount")}
                  </span>
                  <span className="font-medium">
                    {formatOriginalCurrency(subscription.amount, subscription.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {translate(locale, "convertedAmount")}
                  </span>
                  <span className="font-medium">{formatCNY(subscription.amountCNY)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {translate(locale, "startDate")}
                  </span>
                  <span className="font-medium">{subscription.startDate.slice(0, 10)}</span>
                </div>
              </div>

              {subscription.notes && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <p className="text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">
                    {translate(locale, "notes")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {subscription.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/admin/subscriptions/${subscription.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  {translate(locale, "editSubscription")}
                </Link>
                <button
                  type="button"
                  onClick={async (event) => {
                    event.stopPropagation();
                    const confirmed = await confirm({
                      title: "删除订阅",
                      description: "确定要删除此订阅吗？该操作不可恢复。",
                      confirmText: "删除",
                      cancelText: "取消",
                      variant: "danger",
                    });
                    if (confirmed) {
                      onDelete(subscription);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-500 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-400 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  {translate(locale, "deleteSubscription")}
                </button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
