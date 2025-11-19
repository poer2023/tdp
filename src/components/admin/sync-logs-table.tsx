"use client";

/**
 * Sync Logs Table Component
 * Detailed sync job logs table with expandable error details
 */

import { useState } from "react";
import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";
import { Button, Card, CardContent, Chip, Surface } from "@/components/ui-heroui";

type MediaWatchItem = {
  id: string;
  title: string;
  cover: string | null;
  url: string | null;
  watchedAt: Date;
  externalId: string;
};

type SyncJobLogWithItems = SyncJobLog & {
  syncedItems?: MediaWatchItem[];
};

type SyncLogsTableProps = {
  logs: SyncJobLogWithItems[];
};

const STATUS_META: Record<
  SyncJobStatus,
  { label: string; color: "success" | "danger" | "primary" | "warning" | "default" }
> = {
  SUCCESS: { label: "成功", color: "success" },
  FAILED: { label: "失败", color: "danger" },
  RUNNING: { label: "运行中", color: "primary" },
  PENDING: { label: "等待中", color: "warning" },
  PARTIAL: { label: "部分完成", color: "warning" },
};

export function SyncLogsTable({ logs }: SyncLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow((current) => (current === id ? null : id));
  };

  if (logs.length === 0) {
    return (
      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无匹配的同步日志</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">调整筛选条件后再试一次</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const status = STATUS_META[log.status];

        return (
          <Card
            key={log.id}
            variant="secondary"
            className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80"
          >
            <CardContent className="p-0">
              <div className="grid gap-4 border-b border-zinc-200/60 p-4 text-sm dark:border-zinc-800/60 md:grid-cols-12">
                <div className="space-y-2 md:col-span-3">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {log.platform.toUpperCase()}
                  </p>
                  <Chip size="sm" variant="flat" color={status.color} className="font-medium">
                    {status.label}
                  </Chip>
                </div>

                <div className="space-y-1 text-zinc-600 dark:text-zinc-400 md:col-span-3">
                  <p>
                    开始时间:{" "}
                    {log.startedAt
                      ? format(new Date(log.startedAt), "yyyy-MM-dd HH:mm:ss")
                      : "未开始"}
                  </p>
                  {log.duration && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      耗时 {(log.duration / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-zinc-600 dark:text-zinc-400 md:col-span-2">
                  <p>
                    数据量: {log.itemsSuccess}/{log.itemsTotal}
                  </p>
                  {log.itemsFailed > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400">{log.itemsFailed} 失败</p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Chip size="sm" variant="flat" className="font-medium capitalize">
                    触发: {log.triggeredBy}
                  </Chip>
                  {log.jobType && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">类型: {log.jobType}</p>
                  )}
                </div>

                <div className="flex items-start justify-end md:col-span-2">
                  <Button variant="light" size="sm" onPress={() => toggleExpand(log.id)}>
                    {expandedRow === log.id ? "收起详情" : "查看详情"}
                  </Button>
                </div>
              </div>

              {expandedRow === log.id && (
                <div className="space-y-4 bg-zinc-50/70 p-4 dark:bg-zinc-900/40">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Surface
                      variant="flat"
                      className="rounded-2xl border border-zinc-200/70 bg-white/90 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40"
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        作业信息
                      </h4>
                      <dl className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex flex-wrap gap-2">
                          <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Job ID:</dt>
                          <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                            {log.id}
                          </dd>
                        </div>
                        {log.credentialId && (
                          <div className="flex flex-wrap gap-2">
                            <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                              Credential:
                            </dt>
                            <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                              {log.credentialId}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {log.message && (
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            消息
                          </p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{log.message}</p>
                        </div>
                      )}

                      {log.metrics && (
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Metrics
                          </p>
                          <pre className="rounded-xl bg-zinc-100/80 p-3 text-[11px] leading-relaxed text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100">
                            {JSON.stringify(log.metrics, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Surface>

                    <Surface
                      variant="flat"
                      className="rounded-2xl border border-zinc-200/70 bg-white/90 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40"
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        错误信息
                      </h4>

                      {log.status === "FAILED" && log.message && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{log.message}</p>
                      )}

                      {log.errorStack && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Stack Trace
                          </p>
                          <pre className="rounded-xl bg-red-50/80 p-3 text-[11px] leading-relaxed text-red-900 dark:bg-red-950/30 dark:text-red-300">
                            {log.errorStack}
                          </pre>
                        </div>
                      )}

                      {log.errorDetails && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Error Details
                          </p>
                          <pre className="rounded-xl bg-red-50/80 p-3 text-[11px] leading-relaxed text-red-900 dark:bg-red-950/30 dark:text-red-300">
                            {JSON.stringify(log.errorDetails, null, 2)}
                          </pre>
                        </div>
                      )}

                      {!log.message && !log.errorStack && !log.errorDetails && (
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          没有捕获到错误详情。
                        </p>
                      )}
                    </Surface>
                  </div>

                  {log.syncedItems && log.syncedItems.length > 0 && (
                    <Surface
                      variant="flat"
                      className="rounded-2xl border border-zinc-200/70 bg-white/90 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          同步内容 ({log.syncedItems.length})
                        </h4>
                      </div>
                      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                        {log.syncedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-zinc-800/70 dark:bg-zinc-900/40"
                          >
                            {item.cover && (
                              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                                <Image
                                  src={item.cover}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.title}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>
                                  同步时间: {format(new Date(item.watchedAt), "yyyy-MM-dd HH:mm")}
                                </span>
                                {item.url && (
                                  <>
                                    <span>·</span>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                    >
                                      查看
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Surface>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
