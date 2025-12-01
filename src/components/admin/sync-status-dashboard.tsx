"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "PARTIAL":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "RUNNING":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-12 text-center text-stone-500">Failed to load sync status</div>;
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
          Manual Sync
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => triggerSync("bilibili")}
            disabled={!!syncing}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {syncing === "bilibili" && <RefreshCw className="h-4 w-4 animate-spin" />}
            Sync Bilibili
          </button>
          <button
            onClick={() => triggerSync("douban")}
            disabled={!!syncing}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {syncing === "douban" && <RefreshCw className="h-4 w-4 animate-spin" />}
            Sync Douban
          </button>
          <button
            onClick={() => triggerSync("all")}
            disabled={!!syncing}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {syncing === "all" && <RefreshCw className="h-4 w-4 animate-spin" />}
            Sync All
          </button>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="text-sm text-stone-500">Total Syncs</div>
          <div className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {data.stats.total}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="text-sm text-stone-500">Success Rate</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {data.stats.total > 0 ? Math.round((data.stats.success / data.stats.total) * 100) : 0}%
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="text-sm text-stone-500">Total Media Items</div>
          <div className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {data.mediaStats.totalItems}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="text-sm text-stone-500">Recently Added (24h)</div>
          <div className="mt-2 text-3xl font-bold text-sage-600">
            {data.mediaStats.recentlyAdded}
          </div>
        </div>
      </section>

      {/* Recent Sync Jobs */}
      <section className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="border-b border-stone-200 p-6 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Recent Sync Jobs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 dark:bg-stone-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Started At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  Triggered By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {data.recentJobs.slice(0, 10).map((job) => (
                <tr key={job.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <td className="px-6 py-4">{getStatusIcon(job.status)}</td>
                  <td className="px-6 py-4 font-medium text-stone-900 dark:text-stone-100">
                    {job.platform}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {formatDate(job.startedAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {formatDuration(job.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {job.itemsSuccess}/{job.itemsTotal}
                    {job.itemsFailed > 0 && (
                      <span className="ml-1 text-red-500">({job.itemsFailed} failed)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">{job.triggeredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
