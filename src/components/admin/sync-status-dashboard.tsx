"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Spinner,
  Surface,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui-heroui";

interface SyncJob {
  id: string;
  platform: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  itemsTotal: number;
  itemsSuccess: number;
  itemsFailed: number;
  errorMessage: string | null;
  triggeredBy: string;
}

interface SyncStatusData {
  stats: {
    total: number;
    success: number;
    failed: number;
    partial: number;
    running: number;
  };
  platformStats: {
    [key: string]: {
      total: number;
      lastSync: SyncJob | null;
    };
  };
  mediaStats: {
    totalItems: number;
    byPlatform: {
      [key: string]: number;
    };
    recentlyAdded: number;
  };
  recentJobs: SyncJob[];
}

const ACTIONS = [
  { id: "bilibili", label: "同步 Bilibili", color: "primary" as const },
  { id: "douban", label: "同步 Douban", color: "success" as const },
  { id: "all", label: "同步全部", color: "secondary" as const },
];

type StatusMeta = {
  label: string;
  color: "success" | "danger" | "warning" | "primary" | "default";
  icon: ReactNode;
};

const STATUS_META: Record<string, StatusMeta> = {
  SUCCESS: { label: "成功", color: "success", icon: <CheckCircle className="h-4 w-4" /> },
  FAILED: { label: "失败", color: "danger", icon: <XCircle className="h-4 w-4" /> },
  PARTIAL: { label: "部分完成", color: "warning", icon: <AlertCircle className="h-4 w-4" /> },
  RUNNING: {
    label: "运行中",
    color: "primary",
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
  },
  PENDING: { label: "等待中", color: "default", icon: <Clock className="h-4 w-4" /> },
};

export function SyncStatusDashboard() {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/sync/status");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = async (platform: string) => {
    setSyncing(platform);
    try {
      const response = await fetch("/api/admin/sync/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      if (response.ok) {
        // Refresh status after sync
        setTimeout(fetchStatus, 2000);
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      alert("Failed to trigger sync");
    } finally {
      setSyncing(null);
    }
  };

  const getStatusMeta = (status: string): StatusMeta => {
    const meta = STATUS_META[status];
    if (meta) {
      return meta;
    }
    return STATUS_META.PENDING!;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const metrics = useMemo(() => {
    if (!data) return [];
    const successRate =
      data.stats.total > 0 ? Math.round((data.stats.success / data.stats.total) * 100) : 0;
    return [
      {
        label: "同步总数",
        value: data.stats.total.toLocaleString(),
        meta: `${data.stats.running} 个进行中`,
      },
      {
        label: "成功率",
        value: `${successRate}%`,
        meta: `${data.stats.success} 成功 / ${data.stats.failed} 失败`,
      },
      {
        label: "媒体总量",
        value: data.mediaStats.totalItems.toLocaleString(),
        meta: `最近新增 ${data.mediaStats.recentlyAdded}`,
      },
      {
        label: "部分完成",
        value: data.stats.partial.toLocaleString(),
        meta: `${data.stats.failed} 个失败需要关注`,
      },
    ];
  }, [data]);

  const platformEntries = useMemo(
    () => (data ? Object.entries(data.platformStats ?? {}) : []),
    [data]
  );

  if (loading) {
    return (
      <Surface className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl border border-zinc-200 bg-white/70 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
        <Spinner size="lg" />
        正在加载同步状态…
      </Surface>
    );
  }

  if (!data) {
    return (
      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-8">
          <Alert status="warning" title="无法加载同步状态">
            请检查 API 响应或稍后重试。
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Quick Actions */}
      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                控制台
              </p>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">手动触发同步</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                立即触发对应平台同步任务，执行期间按钮会锁定。
              </p>
            </div>
            <Chip size="sm" variant="flat" color="primary">
              {syncing ? `正在同步 ${syncing}` : "空闲"}
            </Chip>
          </div>
          <div className="flex flex-wrap gap-3">
            {ACTIONS.map((action) => (
              <Button
                key={action.id}
                color={action.color}
                onPress={() => triggerSync(action.id)}
                isDisabled={!!syncing}
                startContent={
                  syncing === action.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : undefined
                }
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            variant="secondary"
            className="border border-zinc-200/80 dark:border-zinc-800/80"
          >
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {metric.label}
              </p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{metric.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{metric.meta}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Platform status */}
      {platformEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">平台详情</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                最近同步时间与累计任务统计
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformEntries.map(([platform, info]) => {
              const last = info.lastSync;
              const meta = last ? getStatusMeta(last.status) : null;
              return (
                <Card
                  key={platform}
                  variant="secondary"
                  className="border border-zinc-200/80 dark:border-zinc-800/80"
                >
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {platform}
                      </p>
                      {meta && (
                        <Chip size="sm" variant="flat" color={meta.color}>
                          <span className="mr-1 inline-flex items-center">{meta.label}</span>
                        </Chip>
                      )}
                    </div>
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {info.total.toLocaleString()} 次
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      最近同步：{last ? formatDate(last.startedAt) : "尚无记录"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onPress={() => triggerSync(platform)}
                        isDisabled={!!syncing && syncing !== platform}
                      >
                        立即同步
                      </Button>
                      {last?.duration && (
                        <Chip size="sm" variant="flat">
                          上次耗时 {formatDuration(last.duration)}
                        </Chip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Sync Jobs */}
      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">最近任务</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                最新 10 条同步任务执行记录
              </p>
            </div>
          </div>
          <Table variant="striped" hoverable>
            <TableHead>
              <TableRow>
                <TableHeader>状态</TableHeader>
                <TableHeader>平台</TableHeader>
                <TableHeader>开始时间</TableHeader>
                <TableHeader>耗时</TableHeader>
                <TableHeader>数据量</TableHeader>
                <TableHeader>触发来源</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
                    暂无同步记录
                  </TableCell>
                </TableRow>
              ) : (
                data.recentJobs.slice(0, 10).map((job) => {
                  const meta = getStatusMeta(job.status);
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={meta.color} className="font-medium">
                          <span className="mr-1 inline-flex items-center">{meta.icon}</span>
                          {meta.label}
                        </Chip>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {job.platform}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(job.startedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDuration(job.duration)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                        {job.itemsSuccess}/{job.itemsTotal}
                        {job.itemsFailed > 0 && (
                          <span className="ml-1 text-red-500">({job.itemsFailed} 失败)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
                        {job.triggeredBy}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
