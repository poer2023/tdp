"use client";

/**
 * Sync Logs Table Component
 * Detailed sync job logs table with expandable error details
 */

import { useState } from "react";
import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { format } from "date-fns";

type SyncLogsTableProps = {
  logs: SyncJobLog[];
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Platform & Status */}
                <div className="md:col-span-3">
                  <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {log.platform.toUpperCase()}
                  </div>
                  <div className="mt-1">{getStatusBadge(log.status)}</div>
                </div>

                {/* Time & Duration */}
                <div className="md:col-span-3 text-sm">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {log.startedAt
                      ? format(new Date(log.startedAt), "MMM d, yyyy HH:mm:ss")
                      : "Not started"}
                  </div>
                  {log.duration && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                      Duration: {(log.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="md:col-span-2 text-sm">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {log.itemsSuccess}/{log.itemsTotal} items
                  </div>
                  {log.itemsFailed > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      {log.itemsFailed} failed
                    </div>
                  )}
                </div>

                {/* Triggered By */}
                <div className="md:col-span-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded dark:bg-zinc-800 dark:text-zinc-300">
                    {log.triggeredBy}
                  </span>
                </div>

                {/* Expand Button */}
                <div className="md:col-span-2 text-right">
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
                          <code className="text-xs font-mono text-zinc-900 dark:text-zinc-100">
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
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Credential ID:
                            </span>{" "}
                            <code className="text-xs font-mono text-zinc-900 dark:text-zinc-100">
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
                        <pre className="mt-1 text-xs overflow-x-auto rounded bg-zinc-100 p-2 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                          {JSON.stringify(log.metrics, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {log.message && log.status === 'FAILED' && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Error
                        </h4>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          {log.message}
                        </p>
                      </div>
                    )}

                    {log.errorStack && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Stack Trace
                        </h4>
                        <pre className="mt-1 text-xs overflow-x-auto rounded bg-red-50 p-2 text-red-900 dark:bg-red-950/20 dark:text-red-300">
                          {log.errorStack}
                        </pre>
                      </div>
                    )}

                    {log.errorDetails && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-600 uppercase dark:text-red-400">
                          Error Details
                        </h4>
                        <pre className="mt-1 text-xs overflow-x-auto rounded bg-red-50 p-2 text-red-900 dark:bg-red-950/20 dark:text-red-300">
                          {JSON.stringify(log.errorDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
