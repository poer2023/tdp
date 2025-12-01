/**
 * Admin Sync Dashboard Page
 * Overview of all sync jobs and platform status
 */

import prisma from "@/lib/prisma";
import { SyncMetricsOverview } from "@/components/admin/sync-metrics-overview";
import { RecentSyncJobs } from "@/components/admin/recent-sync-jobs";
import Link from "next/link";
import { features } from "@/config/features";

export const revalidate = 0;
export const runtime = "nodejs";

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

async function getSyncDashboardData() {
  if (SKIP_DB) {
    return {
      recentJobs: [],
      credentials: [],
      stats: {
        totalJobs: 0,
        successJobs: 0,
        failedJobs: 0,
        partialJobs: 0,
        runningJobs: 0,
      },
    };
  }

  try {
    // Fetch recent sync jobs
    const recentJobs = await prisma.syncJobLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        credential: {
          select: {
            platform: true,
            type: true,
            isValid: true,
          },
        },
      },
    });

    // Fetch all credentials with their status
    const credentials = await prisma.externalCredential.findMany({
      select: {
        id: true,
        platform: true,
        type: true,
        isValid: true,
        lastValidatedAt: true,
        lastUsedAt: true,
        usageCount: true,
        failureCount: true,
      },
      orderBy: { platform: "asc" },
    });

    // Calculate statistics
    const stats = {
      totalJobs: await prisma.syncJobLog.count(),
      successJobs: await prisma.syncJobLog.count({ where: { status: "SUCCESS" } }),
      failedJobs: await prisma.syncJobLog.count({ where: { status: "FAILED" } }),
      partialJobs: await prisma.syncJobLog.count({ where: { status: "PARTIAL" } }),
      runningJobs: await prisma.syncJobLog.count({ where: { status: "RUNNING" } }),
    };

    return {
      recentJobs,
      credentials,
      stats,
    };
  } catch (error) {
    console.warn("Failed to load sync dashboard data:", error);
    return {
      recentJobs: [],
      credentials: [],
      stats: {
        totalJobs: 0,
        successJobs: 0,
        failedJobs: 0,
        partialJobs: 0,
        runningJobs: 0,
      },
    };
  }
}

export default async function SyncDashboardPage() {
  if (!features.get("adminSync")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Sync</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            同步仪表板
          </h1>
        </header>
        <section className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          同步功能已被禁用。请将{" "}
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5 text-xs text-stone-700">
            FEATURE_ADMIN_SYNC
          </code>{" "}
          设置为 on 并重新部署以启用此页面。
        </section>
      </div>
    );
  }

  const { recentJobs, credentials, stats } = await getSyncDashboardData();

  // Calculate derived metrics for SyncMetricsOverview
  const successRate = stats.totalJobs > 0 ? (stats.successJobs / stats.totalJobs) * 100 : 0;

  // Calculate average duration from recent successful jobs
  const successfulJobs = recentJobs.filter((j) => j.status === "SUCCESS" && j.duration);
  const avgDuration =
    successfulJobs.length > 0
      ? successfulJobs.reduce((sum, j) => sum + (j.duration || 0), 0) / successfulJobs.length
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            同步仪表板
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            管理数据同步任务和平台连接状态
          </p>
        </div>
        <Link
          href="/admin/credentials"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          管理凭据
        </Link>
      </header>

      {/* Metrics Overview */}
      <SyncMetricsOverview
        totalJobs={stats.totalJobs}
        successJobs={stats.successJobs}
        failedJobs={stats.failedJobs}
        runningJobs={stats.runningJobs}
        successRate={successRate}
        avgDuration={avgDuration}
      />

      {/* Platform Status Cards */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">平台状态</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {credentials.length === 0 ? (
            <div className="col-span-full rounded-xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {SKIP_DB ? "当前处于离线模式，无法加载凭据。" : "暂无配置的凭据"}
              </p>
              <Link
                href="/admin/credentials/new"
                className="mt-4 inline-flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 dark:text-sage-400"
              >
                添加第一个凭据 →
              </Link>
            </div>
          ) : (
            credentials.map((cred) => (
              <Link
                key={cred.id}
                href={`/admin/credentials/${cred.id}`}
                className="group block rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500 uppercase dark:text-stone-400">
                    {cred.platform}
                  </span>
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      cred.isValid ? "bg-green-500 dark:bg-green-400" : "bg-red-500 dark:bg-red-400"
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                    {cred.usageCount}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">次同步</div>
                </div>
                {cred.failureCount > 0 && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {cred.failureCount} 次失败
                  </div>
                )}
                {cred.lastUsedAt && (
                  <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    上次: {new Date(cred.lastUsedAt).toLocaleDateString()}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent Sync Jobs */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">最近同步</h2>
          <Link
            href="/admin/sync/logs"
            className="text-sm text-sage-600 hover:text-sage-800 dark:text-sage-400"
          >
            查看全部 →
          </Link>
        </div>
        <div className="mt-4">
          <RecentSyncJobs jobs={recentJobs} />
        </div>
      </div>
    </div>
  );
}
