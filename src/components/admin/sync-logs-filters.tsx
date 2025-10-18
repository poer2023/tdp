"use client";

/**
 * Sync Logs Filters Component
 * Client-side filtering UI for sync logs
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SyncJobStatus } from "@prisma/client";

type SyncLogsFiltersProps = {
  platforms: string[];
  currentFilters: {
    platform?: string;
    status?: SyncJobStatus;
    triggeredBy?: string;
    jobId?: string;
  };
};

export function SyncLogsFilters({ platforms, currentFilters }: SyncLogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState(currentFilters.platform || "");
  const [status, setStatus] = useState(currentFilters.status || "");
  const [triggeredBy, setTriggeredBy] = useState(currentFilters.triggeredBy || "");

  const handleFilter = () => {
    const params = new URLSearchParams();

    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    if (triggeredBy) params.set("triggeredBy", triggeredBy);

    // Keep limit if it exists
    const limit = searchParams.get("limit");
    if (limit) params.set("limit", limit);

    router.push(`/admin/sync/logs?${params.toString()}`);
  };

  const handleReset = () => {
    setPlatform("");
    setStatus("");
    setTriggeredBy("");
    router.push("/admin/sync/logs");
  };

  const hasFilters = currentFilters.platform || currentFilters.status || currentFilters.triggeredBy;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4 dark:text-zinc-300">
        Filter Logs
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Platform Filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1 dark:text-zinc-400">
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1 dark:text-zinc-400">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Status</option>
            {Object.values(SyncJobStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Triggered By Filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1 dark:text-zinc-400">
            Triggered By
          </label>
          <select
            value={triggeredBy}
            onChange={(e) => setTriggeredBy(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Sources</option>
            <option value="system">System</option>
            <option value="manual">Manual</option>
            <option value="cron">Cron</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleFilter}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Apply Filters
        </button>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
          >
            Reset
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Active filters:</span>
          {currentFilters.platform && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-950/20 dark:text-blue-400">
              Platform: {currentFilters.platform.toUpperCase()}
            </span>
          )}
          {currentFilters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-950/20 dark:text-blue-400">
              Status: {currentFilters.status}
            </span>
          )}
          {currentFilters.triggeredBy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-950/20 dark:text-blue-400">
              Triggered By: {currentFilters.triggeredBy}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
