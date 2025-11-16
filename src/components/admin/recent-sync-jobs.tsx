/**
 * Recent Sync Jobs Component
 * Displays a table of recent sync jobs with status and details
 */

import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Table, Chip, Button } from "@/components/ui-heroui";

type RecentSyncJobsProps = {
  jobs: SyncJobLog[];
};

export function RecentSyncJobs({ jobs }: RecentSyncJobsProps) {
  const getStatusChip = (status: SyncJobStatus) => {
    const statusMap: Record<SyncJobStatus, { label: string; color: "success" | "danger" | "warning" | "primary" | "default" }> = {
      SUCCESS: { label: "Success", color: "success" },
      FAILED: { label: "Failed", color: "danger" },
      RUNNING: { label: "Running", color: "primary" },
      PENDING: { label: "Pending", color: "warning" },
      PARTIAL: { label: "Partial", color: "warning" },
    };
    const { label, color } = statusMap[status];
    return (
      <Chip color={color} variant="flat" size="sm">
        {label}
      </Chip>
    );
  };

  return (
    <Table variant="striped" hoverable>
      <Table.Head>
        <Table.Row>
          <Table.Header>Platform</Table.Header>
          <Table.Header>Status</Table.Header>
          <Table.Header>Duration</Table.Header>
          <Table.Header>Items</Table.Header>
          <Table.Header>Started</Table.Header>
          <Table.Header className="text-right">Actions</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {jobs.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={6} className="text-center text-sm text-zinc-500">
              No sync jobs found
            </Table.Cell>
          </Table.Row>
        ) : (
          jobs.map((job) => (
            <Table.Row key={job.id}>
              <Table.Cell className="font-semibold text-zinc-900 dark:text-zinc-100">
                {job.platform.toUpperCase()}
              </Table.Cell>
              <Table.Cell>{getStatusChip(job.status)}</Table.Cell>
              <Table.Cell className="text-zinc-500 dark:text-zinc-400">
                {job.duration ? `${(job.duration / 1000).toFixed(1)}s` : "-"}
              </Table.Cell>
              <Table.Cell className="text-zinc-500 dark:text-zinc-400">
                {job.itemsSuccess}/{job.itemsTotal}
                {job.itemsFailed > 0 && (
                  <span className="ml-1 text-red-500">({job.itemsFailed} failed)</span>
                )}
              </Table.Cell>
              <Table.Cell className="text-zinc-500 dark:text-zinc-400">
                {job.startedAt
                  ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                  : "-"}
              </Table.Cell>
              <Table.Cell className="text-right">
                <Button asChild variant="light" size="sm">
                  <Link href={`/admin/sync/logs?jobId=${job.id}`}>View Details</Link>
                </Button>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table>
  );
}
