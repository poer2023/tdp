/**
 * Recent Sync Jobs Component
 * Displays a table of recent sync jobs with status and details
 */

import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type RecentSyncJobsProps = {
  jobs: SyncJobLog[];
};

export function RecentSyncJobs({ jobs }: RecentSyncJobsProps) {
  const getStatusBadge = (status: SyncJobStatus) => {
    const styles: Record<SyncJobStatus, string> = {
      SUCCESS: "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400",
      RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400",
      PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400",
    };

    const labels: Record<SyncJobStatus, string> = {
      SUCCESS: "✅ Success",
      FAILED: "❌ Failed",
      RUNNING: "🔄 Running",
      PENDING: "⏳ Pending",
      PARTIAL: "⚠️ Partial",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Platform
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Started
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-zinc-500">
                No sync jobs found
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {job.platform.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                  {job.duration ? `${(job.duration / 1000).toFixed(1)}s` : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                  {job.itemsSuccess}/{job.itemsTotal}
                  {job.itemsFailed > 0 && (
                    <span className="ml-1 text-red-600 dark:text-red-400">
                      ({job.itemsFailed} failed)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                  {job.startedAt
                    ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/sync/logs?jobId=${job.id}`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
