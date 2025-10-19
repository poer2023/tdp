/**
 * Sync Metrics Overview Component
 * Displays key sync metrics in a grid of metric cards
 */

import { MetricCard } from "./metric-card";

type SyncMetricsOverviewProps = {
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  runningJobs: number;
  successRate: number;
  avgDuration: number;
};

export function SyncMetricsOverview({
  totalJobs,
  successJobs,
  failedJobs,
  runningJobs,
  successRate,
  avgDuration,
}: SyncMetricsOverviewProps) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        label="Total Sync Jobs"
        value={totalJobs}
        meta={`${runningJobs} currently running`}
      />
      <MetricCard
        label="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        meta={`${successJobs} success · ${failedJobs} failed`}
      />
      <MetricCard
        label="Average Duration"
        value={avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : "N/A"}
        meta="Based on recent successful jobs"
      />
    </section>
  );
}
