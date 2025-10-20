"use client";

/**
 * Sync Logs Table Component
 * Detailed sync job logs table with expandable error details
 */

import { useState } from "react";
import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";

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

export function SyncLogsTable({ logs }: SyncLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No logs found matching your filters
          </p>
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Main Row */}
            <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
                {/* Platform & Status */}
                <div className="md:col-span-3">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {log.platform.toUpperCase()}
                  </div>
                  <div className="mt-1">{getStatusBadge(log.status)}</div>
                </div>

                {/* Time & Duration */}
                <div className="text-sm md:col-span-3">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {log.startedAt
                      ? format(new Date(log.startedAt), "MMM d, yyyy HH:mm:ss")
                      : "Not started"}
                  </div>
                  {log.duration && (
                    <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      Duration: {(log.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="text-sm md:col-span-2">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {log.itemsSuccess}/{log.itemsTotal} items
                  </div>
                  {log.itemsFailed > 0 && (
                    <div className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                      {log.itemsFailed} failed
                    </div>
                  )}
                </div>

                {/* Triggered By */}
                <div className="text-sm text-zinc-600 md:col-span-2 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {log.triggeredBy}
                  </span>
                </div>

                {/* Expand Button */}
                <div className="text-right md:col-span-2">
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {expandedRow === log.id ? "Hide Details" : "Show Details"}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRow === log.id && (
              <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">
                        Job Details
                      </h4>
                      <div className="mt-1 space-y-1 text-sm">
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">Job ID:</span>{" "}
                          <code className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                            {log.id}
                          </code>
                        </div>
                        {log.jobType && (
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Type:</span>{" "}
                            <span className="text-zinc-900 dark:text-zinc-100">{log.jobType}</span>
                          </div>
                        )}
                        {log.credentialId && (
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Credential ID:</span>{" "}
                            <code className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                              {log.credentialId}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    {log.message && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">
                          Message
                        </h4>
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {log.message}
                        </p>
                      </div>
                    )}

                    {log.metrics && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">
                          Metrics
                        </h4>
                        <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-2 text-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                          {JSON.stringify(log.metrics, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {log.message && log.status === "FAILED" && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Error
                        </h4>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{log.message}</p>
                      </div>
                    )}

                    {log.errorStack && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Stack Trace
                        </h4>
                        <pre className="mt-1 overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-900 dark:bg-red-950/20 dark:text-red-300">
                          {log.errorStack}
                        </pre>
                      </div>
                    )}

                    {log.errorDetails && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Error Details
                        </h4>
                        <pre className="mt-1 overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-900 dark:bg-red-950/20 dark:text-red-300">
                          {JSON.stringify(log.errorDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Synced Items Section */}
                {log.syncedItems && log.syncedItems.length > 0 && (
                  <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    <h4 className="mb-3 text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">
                      Synced Content ({log.syncedItems.length} items)
                    </h4>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {log.syncedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                        >
                          {/* Cover Image */}
                          {item.cover && (
                            <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                              <Image
                                src={item.cover}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}

                          {/* Content Info */}
                          <div className="flex-1 min-w-0">
                            <h5 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {item.title}
                            </h5>
                            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                              <span>
                                Watched: {format(new Date(item.watchedAt), "MMM d, yyyy HH:mm")}
                              </span>
                              {item.url && (
                                <>
                                  <span>·</span>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    View
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
