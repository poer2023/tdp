"use client";

/**
 * Attention Needed Component
 * Displays items that require admin attention:
 * - Old drafts (>7 days)
 * - Sync failures
 * - Credential expirations
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui-heroui";
import { t, type AdminLocale } from "@/lib/admin-translations";
import type { Post, SyncJobLog, ExternalCredential } from "@prisma/client";

type AttentionItem = {
  type: "draft" | "sync_failure" | "credential_expiring";
  title: string;
  description: string;
  href: string;
  daysOld?: number;
  severity: "warning" | "error";
};

type AttentionNeededProps = {
  oldDrafts: (Pick<Post, "id" | "title" | "updatedAt">)[];
  failedSyncs: (Pick<SyncJobLog, "id" | "platform" | "startedAt" | "message">)[];
  expiringCredentials: (Pick<ExternalCredential, "id" | "platform" | "validUntil">)[];
  locale: AdminLocale;
};

function getDaysAgo(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function AttentionNeeded({
  oldDrafts,
  failedSyncs,
  expiringCredentials,
  locale,
}: AttentionNeededProps) {
  const items: AttentionItem[] = [];

  // Add old draft items
  oldDrafts.forEach((draft) => {
    const daysOld = getDaysAgo(draft.updatedAt);
    items.push({
      type: "draft",
      title: draft.title,
      description:
        locale === "zh"
          ? `草稿已 ${daysOld} 天未更新`
          : `Draft not updated for ${daysOld} days`,
      href: `/admin/posts/${draft.id}`,
      daysOld,
      severity: daysOld > 30 ? "error" : "warning",
    });
  });

  // Add sync failure items
  failedSyncs.forEach((sync) => {
    if (!sync.startedAt) return;

    const daysAgo = getDaysAgo(sync.startedAt as Date);
    items.push({
      type: "sync_failure",
      title:
        locale === "zh"
          ? `${sync.platform} 同步失败`
          : `${sync.platform} sync failed`,
      description: sync.message || (locale === "zh" ? "同步任务失败" : "Sync job failed"),
      href: `/admin/sync/logs?platform=${sync.platform}`,
      daysOld: daysAgo,
      severity: "error",
    });
  });

  // Add credential expiration items
  expiringCredentials.forEach((credential) => {
    if (!credential.validUntil) return;

    const daysUntilExpiry = getDaysAgo(credential.validUntil as Date);
    const isExpired = new Date(credential.validUntil as Date) < new Date();

    items.push({
      type: "credential_expiring",
      title:
        locale === "zh"
          ? `${credential.platform} 凭证${isExpired ? "已过期" : "即将过期"}`
          : `${credential.platform} credential ${isExpired ? "expired" : "expiring"}`,
      description: isExpired
        ? locale === "zh"
          ? `已过期 ${daysUntilExpiry} 天`
          : `Expired ${daysUntilExpiry} days ago`
        : locale === "zh"
          ? `${daysUntilExpiry} 天后过期`
          : `Expires in ${daysUntilExpiry} days`,
      href: `/admin/credentials/${credential.id}`,
      daysOld: daysUntilExpiry,
      severity: isExpired || daysUntilExpiry <= 7 ? "error" : "warning",
    });
  });

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  // Sort by severity and days
  items.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "error" ? -1 : 1;
    }
    return (b.daysOld || 0) - (a.daysOld || 0);
  });

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        {t(locale, "attentionNeeded")}
      </h2>

      <Card
        variant="default"
        className="border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40"
      >
        <CardContent className="flex flex-col gap-3">
          {/* Warning icon and count */}
          <div className="flex items-center gap-3 border-b border-amber-200 pb-3 dark:border-amber-900/60">
            <svg
              className="h-6 w-6 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                {items.length} {locale === "zh" ? "项需要关注" : "items need attention"}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-500">
                {locale === "zh"
                  ? "以下内容需要您的处理"
                  : "The following items require your action"}
              </p>
            </div>
          </div>

          {/* Items list */}
          <ul className="space-y-2">
            {items.slice(0, 5).map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-amber-200 bg-white p-3 transition-all hover:border-amber-300 hover:shadow-sm dark:border-amber-900/40 dark:bg-zinc-900 dark:hover:border-amber-800"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 pt-0.5">
                      {item.type === "draft" && (
                        <svg
                          className="h-4 w-4 text-amber-600 dark:text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      )}
                      {item.type === "sync_failure" && (
                        <svg
                          className="h-4 w-4 text-red-600 dark:text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      {item.type === "credential_expiring" && (
                        <svg
                          className="h-4 w-4 text-amber-600 dark:text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </div>

                    {/* Severity badge */}
                    {item.severity === "error" && (
                      <span className="flex-shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        {locale === "zh" ? "紧急" : "Urgent"}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Show more if there are more than 5 items */}
          {items.length > 5 && (
            <div className="border-t border-amber-200 pt-3 text-center dark:border-amber-900/60">
              <p className="text-xs text-amber-700 dark:text-amber-500">
                {locale === "zh"
                  ? `还有 ${items.length - 5} 项未显示`
                  : `${items.length - 5} more items not shown`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
