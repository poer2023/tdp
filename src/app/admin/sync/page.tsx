/**
 * Admin Sync Dashboard Page
 * Overview of all sync jobs and platform status
 */

import prisma from "@/lib/prisma";
import { SyncMetricsOverview } from "@/components/admin/sync-metrics-overview";
import { RecentSyncJobs } from "@/components/admin/recent-sync-jobs";
import Link from "next/link";
import { features } from "@/config/features";
import { Alert, Button, Card, CardContent, Chip, Surface } from "@/components/ui-heroui";

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
        <header className="space-y-2">
          <p className="text-xs font-medium tracking-[0.3em] text-zinc-500 uppercase dark:text-zinc-400">
            Sync
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
            同步仪表板
          </h1>
        </header>
        <Surface
          variant="bordered"
          className="rounded-3xl border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Alert
            status="warning"
            title="同步功能已禁用"
            description="请打开 FEATURE_ADMIN_SYNC 环境变量并重新部署以启用此仪表板。"
          >
            <code className="inline-flex rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              FEATURE_ADMIN_SYNC=on
            </code>
          </Alert>
        </Surface>
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
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
            Sync
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            同步仪表板
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            管理数据同步任务和平台连接状态
          </p>
        </div>
        <Button asChild color="primary" variant="solid" size="md" className="w-full sm:w-auto">
          <Link href="/admin/credentials" className="inline-flex items-center gap-2">
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
        </Button>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">平台状态</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              查看各平台凭据健康状况与同步频次
            </p>
          </div>
          <Button asChild variant="light" size="sm">
            <Link href="/admin/credentials/new">添加凭据</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {credentials.length === 0 ? (
            <Card variant="secondary" className="col-span-full">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {SKIP_DB ? "当前处于离线模式，无法加载凭据。" : "暂无配置的凭据"}
              </p>
              <Button asChild color="primary" size="sm">
                <Link href="/admin/credentials/new">添加第一个凭据</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
            credentials.map((cred) => (
              <Link key={cred.id} href={`/admin/credentials/${cred.id}`} className="block">
                <Card variant="secondary" className="transition duration-150 hover:-translate-y-0.5">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {cred.platform}
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={cred.isValid ? "success" : "danger"}
                        className="font-semibold"
                      >
                        {cred.isValid ? "正常" : "失效"}
                      </Chip>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                          {cred.usageCount}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">累计同步</p>
                      </div>
                      {cred.failureCount > 0 && (
                        <Chip size="sm" variant="flat" color="danger">
                          {cred.failureCount} 次失败
                        </Chip>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <p>类型：{cred.type}</p>
                      {cred.lastUsedAt ? (
                        <p>上次使用：{new Date(cred.lastUsedAt).toLocaleDateString()}</p>
                      ) : (
                        <p>尚未使用</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent Sync Jobs */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">最近同步</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              观察最近 20 条同步记录
            </p>
          </div>
          <Button asChild variant="light" size="sm">
            <Link href="/admin/sync/logs">查看全部</Link>
          </Button>
        </div>
        <div className="mt-4">
          <RecentSyncJobs jobs={recentJobs} />
        </div>
      </div>
    </div>
  );
}
