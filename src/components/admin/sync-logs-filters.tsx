"use client";

/**
 * Sync Logs Filters Component
 * Client-side filtering UI for sync logs
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SyncJobStatus } from "@prisma/client";
import { Button, Card, CardContent, Chip, Input, Select } from "@/components/ui-heroui";

type SyncLogsFiltersProps = {
  platforms: string[];
  currentFilters: {
    platform?: string;
    status?: SyncJobStatus;
    triggeredBy?: string;
    jobId?: string;
  };
};

const ALL_OPTION = "__all__";
const TRIGGERED_OPTIONS = [
  { id: ALL_OPTION, label: "全部来源" },
  { id: "system", label: "System" },
  { id: "manual", label: "Manual" },
  { id: "cron", label: "Cron" },
];

export function SyncLogsFilters({ platforms, currentFilters }: SyncLogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState(currentFilters.platform || "");
  const [status, setStatus] = useState(currentFilters.status || "");
  const [triggeredBy, setTriggeredBy] = useState(currentFilters.triggeredBy || "");
  const [jobId, setJobId] = useState(currentFilters.jobId || "");

  const statusOptions = useMemo(
    () => [
      { id: ALL_OPTION, label: "全部状态" },
      ...Object.values(SyncJobStatus).map((value) => ({ id: value, label: value })),
    ],
    []
  );

  const handleFilter = () => {
    const params = new URLSearchParams();

    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    if (triggeredBy) params.set("triggeredBy", triggeredBy);
    if (jobId.trim()) params.set("jobId", jobId.trim());

    // Keep limit if it exists
    const limit = searchParams.get("limit");
    if (limit) params.set("limit", limit);

    router.push(`/admin/sync/logs?${params.toString()}`);
  };

  const handleReset = () => {
    setPlatform("");
    setStatus("");
    setTriggeredBy("");
    setJobId("");
    router.push("/admin/sync/logs");
  };

  const hasFilters =
    currentFilters.platform || currentFilters.status || currentFilters.triggeredBy || currentFilters.jobId;
  const platformValue = platform || ALL_OPTION;
  const statusValue = status || ALL_OPTION;
  const triggeredValue = triggeredBy || ALL_OPTION;

  return (
    <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Filters
            </p>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">筛选同步日志</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              通过平台、状态、触发来源和 Job ID 快速定位任务
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters && (
              <Button variant="light" size="sm" onPress={handleReset}>
                重置
              </Button>
            )}
            <Button color="primary" size="sm" onPress={handleFilter}>
              应用筛选
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Platform"
            placeholder=""
            value={platformValue}
            onChange={(value) => setPlatform(value === ALL_OPTION ? "" : value)}
          >
            <Select.Item id={ALL_OPTION}>全部平台</Select.Item>
            {platforms.map((p) => (
              <Select.Item key={p} id={p}>
                {p.toUpperCase()}
              </Select.Item>
            ))}
          </Select>

          <Select
            label="Status"
            placeholder=""
            value={statusValue}
            onChange={(value) => setStatus(value === ALL_OPTION ? "" : (value as SyncJobStatus))}
          >
            {statusOptions.map((option) => (
              <Select.Item key={option.id} id={option.id}>
                {option.label}
              </Select.Item>
            ))}
          </Select>

          <Select
            label="Triggered By"
            placeholder=""
            value={triggeredValue}
            onChange={(value) => setTriggeredBy(value === ALL_OPTION ? "" : value)}
          >
            {TRIGGERED_OPTIONS.map((option) => (
              <Select.Item key={option.id} id={option.id}>
                {option.label}
              </Select.Item>
            ))}
          </Select>

          <Input
            label="Job ID"
            placeholder="输入日志 ID 精确查找"
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
          />
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              当前筛选:
            </span>
            {currentFilters.platform && (
              <Chip size="sm" variant="flat" color="primary" className="font-medium">
                平台: {currentFilters.platform.toUpperCase()}
              </Chip>
            )}
            {currentFilters.status && (
              <Chip size="sm" variant="flat" color="primary" className="font-medium">
                状态: {currentFilters.status}
              </Chip>
            )}
            {currentFilters.triggeredBy && (
              <Chip size="sm" variant="flat" color="primary" className="font-medium capitalize">
                来源: {currentFilters.triggeredBy}
              </Chip>
            )}
            {currentFilters.jobId && (
              <Chip size="sm" variant="flat" color="primary" className="font-mono text-xs">
                Job ID: {currentFilters.jobId}
              </Chip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
