/**
 * Admin Sync Logs Page
 * Detailed sync job logs with filtering, search, and pagination
 */

import prisma from "@/lib/prisma";
import { Prisma, SyncJobStatus } from "@prisma/client";
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

type SyncedItem = {
  id: string;
  title: string;
  cover: string | null;
  url: string | null;
  watchedAt: Date;
  externalId: string;
};

type LegacySyncedItemRow = SyncedItem & {
  syncJobLogId: string | null;
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
  const where: Record<string, string> = {};

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

  let logsResult = logs;

  if (logs.length > 0) {
    const logIds = logs.map((log) => log.id);
    let hydrated = false;

    const syncLogDelegate = (
      prisma as {
        mediaWatchSyncLog?: {
          findMany?: typeof prisma.mediaWatchSyncLog.findMany;
        };
      }
    ).mediaWatchSyncLog;

    if (typeof syncLogDelegate?.findMany === "function") {
      try {
        const syncEntries = await syncLogDelegate.findMany({
          where: { syncJobLogId: { in: logIds } },
          orderBy: [{ syncJobLogId: "asc" }, { syncedAt: "desc" }],
          include: {
            mediaWatch: {
              select: {
                id: true,
                title: true,
                cover: true,
                url: true,
                watchedAt: true,
                externalId: true,
              },
            },
          },
        });

        const itemsByLogId = syncEntries.reduce<Record<string, SyncedItem[]>>((acc, entry) => {
          const item = entry.mediaWatch;
          if (!item) return acc;
          const list = acc[entry.syncJobLogId] ?? [];
          list.push({
            id: item.id,
            title: item.title,
            cover: item.cover,
            url: item.url,
            watchedAt: item.watchedAt,
            externalId: item.externalId,
          });
          acc[entry.syncJobLogId] = list;
          return acc;
        }, {});

        logsResult = logs.map((log) => ({
          ...log,
          syncedItems: itemsByLogId[log.id] ?? [],
        }));
        hydrated = true;
      } catch (error) {
        const shouldIgnore = (() => {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
            return false;
          }

          if (error.code === "P2021" || error.code === "P2022") {
            return true;
          }

          if (error.code === "P2010") {
            const meta = error.meta;
            const postgresCode =
              typeof meta === "object" && meta && "code" in meta
                ? (meta.code as unknown)
                : undefined;
            if (typeof postgresCode === "string" && postgresCode === "42703") {
              return true;
            }
            if (typeof meta === "object" && meta && "message" in meta) {
              const metaMessage = meta.message as unknown;
              if (
                typeof metaMessage === "string" &&
                metaMessage.includes('column "') &&
                metaMessage.includes('" does not exist')
              ) {
                return true;
              }
            }
          }

          if (
            typeof error.message === "string" &&
            error.message.includes('column "') &&
            error.message.includes('" does not exist')
          ) {
            return true;
          }

          return false;
        })();

        if (!shouldIgnore) {
          throw error;
        }
      }
    }

    if (!hydrated) {
      // Fallback 1: raw join against MediaWatchSyncLog (works even if Prisma delegate missing)
      try {
        const joined = await prisma.$queryRaw<LegacySyncedItemRow[]>`
          SELECT
            mw."id",
            mw."title",
            mw."cover",
            mw."url",
            mw."watchedAt",
            mw."externalId",
            msl."syncJobLogId"
          FROM "MediaWatchSyncLog" AS msl
          INNER JOIN "MediaWatch" AS mw ON mw."id" = msl."mediaWatchId"
          WHERE msl."syncJobLogId" IN (${Prisma.join(logIds)})
          ORDER BY msl."syncJobLogId" ASC, msl."syncedAt" DESC
        `;

        const itemsByLogId = joined.reduce<Record<string, SyncedItem[]>>((acc, item) => {
          if (!item.syncJobLogId) return acc;
          const list = acc[item.syncJobLogId] ?? [];
          list.push({
            id: item.id,
            title: item.title,
            cover: item.cover,
            url: item.url,
            watchedAt: item.watchedAt,
            externalId: item.externalId,
          });
          acc[item.syncJobLogId] = list;
          return acc;
        }, {});

        logsResult = logs.map((log) => ({
          ...log,
          syncedItems: itemsByLogId[log.id] ?? [],
        }));
        hydrated = true;
      } catch (error: unknown) {
        // Ignore if the junction table doesn't exist yet in DB
        const code =
          error && typeof error === "object" && "code" in error
            ? (error as { code: string }).code
            : undefined;
        const message =
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "";
        const metaCode =
          error &&
          typeof error === "object" &&
          "meta" in error &&
          typeof (error as { meta?: { code?: string } }).meta === "object" &&
          (error as { meta?: { code?: string } }).meta?.code
            ? (error as { meta: { code: string } }).meta.code
            : undefined;

        const metaMessage =
          error &&
          typeof error === "object" &&
          "meta" in error &&
          typeof (error as { meta?: { message?: unknown } }).meta === "object" &&
          (error as { meta?: { message?: unknown } }).meta?.message
            ? String((error as { meta: { message: unknown } }).meta.message)
            : "";

        const isRelationMissing =
          (code === "P2010" &&
            (metaCode === "42P01" || /relation ".+" does not exist/i.test(metaMessage))) ||
          /relation ".+" does not exist/i.test(message) ||
          /42P01/.test(message);

        if (!isRelationMissing) {
          throw error;
        }
      }
    }

    if (!hydrated) {
      try {
        // Check if legacy column exists before querying it
        const legacyColumnCheck = await prisma.$queryRaw<{ exists: boolean }[]>`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = ${"MediaWatch"}
              AND column_name = ${"syncJobLogId"}
          ) AS "exists";
        `;

        const legacyColumnExists =
          Array.isArray(legacyColumnCheck) &&
          legacyColumnCheck.length > 0 &&
          !!legacyColumnCheck[0]?.exists;

        if (legacyColumnExists) {
          const legacyItems = await prisma.$queryRaw<LegacySyncedItemRow[]>`
            SELECT
              "id",
              "title",
              "cover",
              "url",
              "watchedAt",
              "externalId",
              "syncJobLogId"
            FROM "MediaWatch"
            WHERE "syncJobLogId" IN (${Prisma.join(logIds)})
            ORDER BY "syncJobLogId" ASC, "watchedAt" DESC
          `;

          const itemsByLogId = legacyItems.reduce<Record<string, SyncedItem[]>>((acc, item) => {
            if (!item.syncJobLogId) return acc;
            const list = acc[item.syncJobLogId] ?? [];
            list.push({
              id: item.id,
              title: item.title,
              cover: item.cover,
              url: item.url,
              watchedAt: item.watchedAt,
              externalId: item.externalId,
            });
            acc[item.syncJobLogId] = list;
            return acc;
          }, {});

          logsResult = logs.map((log) => ({
            ...log,
            syncedItems: itemsByLogId[log.id] ?? [],
          }));
          hydrated = true;
        }
      } catch (error: unknown) {
        // Ignore legacy schema errors (e.g., missing column) and only rethrow unknown ones
        const code =
          error && typeof error === "object" && "code" in error
            ? (error as { code: string }).code
            : undefined;
        const message =
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "";
        const metaMessage =
          error &&
          typeof error === "object" &&
          "meta" in error &&
          typeof (error as { meta?: { message?: unknown } }).meta === "object" &&
          (error as { meta?: { message?: unknown } }).meta?.message
            ? String((error as { meta: { message: unknown } }).meta.message)
            : "";
        const metaCode =
          error &&
          typeof error === "object" &&
          "meta" in error &&
          typeof (error as { meta?: { code?: string } }).meta === "object" &&
          (error as { meta?: { code?: string } }).meta?.code
            ? (error as { meta: { code: string } }).meta.code
            : undefined;

        const isIgnorable =
          code === "P2021" ||
          code === "P2022" ||
          (code === "P2010" &&
            (metaCode === "42703" || /column ".+" does not exist/i.test(metaMessage))) ||
          /column ".+" does not exist/i.test(message) ||
          /42703/.test(message);

        if (!isIgnorable) {
          throw error;
        }
      }
    }
  }

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
      <SyncLogsTable logs={logsResult} />

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
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              hasPrevPage
                ? "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600"
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
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              hasNextPage
                ? "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600"
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
