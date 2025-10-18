/**
 * Admin Sync Logs Page
 * Detailed sync job logs with filtering, search, and pagination
 */

import prisma from "@/lib/prisma";
import { SyncJobStatus } from "@prisma/client";
import { SyncLogsTable } from "@/components/admin/sync-logs-table";
import { SyncLogsFilters } from "@/components/admin/sync-logs-filters";

export const revalidate = 0;
export const runtime = "nodejs";

type SearchParams = {
  platform?: string;
  status?: SyncJobStatus;
  triggeredBy?: string;
  page?: string;
  limit?: string;
  jobId?: string;
};

export default async function SyncLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Parse pagination and filters
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "50", 10);
  const platform = params.platform;
  const status = params.status;
  const triggeredBy = params.triggeredBy;
  const jobId = params.jobId;

  // Build where clause
  const where: any = {};

  if (jobId) {
    where.id = jobId;
  } else {
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (triggeredBy) where.triggeredBy = triggeredBy;
  }

  // Fetch logs and total count in parallel
  const [logs, totalCount] = await Promise.all([
    prisma.syncJobLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.syncJobLog.count({ where }),
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Get unique platforms for filter
  const platforms = await prisma.syncJobLog.findMany({
    select: { platform: true },
    distinct: ["platform"],
    orderBy: { platform: "asc" },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Sync Logs
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          View detailed sync job logs with filtering and search
        </p>
      </header>

      {/* Filters */}
      <SyncLogsFilters
        platforms={platforms.map((p) => p.platform)}
        currentFilters={{
          platform,
          status,
          triggeredBy,
          jobId,
        }}
      />

      {/* Summary Stats */}
      {!jobId && (
        <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} of {totalCount}{" "}
            logs
          </span>
          <span>·</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
      )}

      {/* Logs Table */}
      <SyncLogsTable logs={logs} />

      {/* Pagination */}
      {!jobId && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <a
            href={
              hasPrevPage
                ? `/admin/sync/logs?${new URLSearchParams({
                    ...(platform && { platform }),
                    ...(status && { status }),
                    ...(triggeredBy && { triggeredBy }),
                    page: (page - 1).toString(),
                    limit: limit.toString(),
                  }).toString()}`
                : "#"
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              hasPrevPage
                ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600 dark:border-zinc-700"
            }`}
            aria-disabled={!hasPrevPage}
          >
            Previous
          </a>

          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {page} of {totalPages}
          </span>

          <a
            href={
              hasNextPage
                ? `/admin/sync/logs?${new URLSearchParams({
                    ...(platform && { platform }),
                    ...(status && { status }),
                    ...(triggeredBy && { triggeredBy }),
                    page: (page + 1).toString(),
                    limit: limit.toString(),
                  }).toString()}`
                : "#"
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              hasNextPage
                ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600 dark:border-zinc-700"
            }`}
            aria-disabled={!hasNextPage}
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}
