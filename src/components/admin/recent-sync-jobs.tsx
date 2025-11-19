/**
 * Recent Sync Jobs Component
 * Displays a table of recent sync jobs with status and details
 */

import type { SyncJobLog, SyncJobStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Chip,
  Button,
} from "@/components/ui-heroui";

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
      <TableHead>
        <TableRow>
          <TableHeader>Platform</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Duration</TableHeader>
          <TableHeader>Items</TableHeader>
          <TableHeader>Started</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {jobs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
              No sync jobs found
            </TableCell>
          </TableRow>
        ) : (
          jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                {job.platform.toUpperCase()}
              </TableCell>
              <TableCell>{getStatusChip(job.status)}</TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400">
                {job.duration ? `${(job.duration / 1000).toFixed(1)}s` : "-"}
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400">
                {job.itemsSuccess}/{job.itemsTotal}
                {job.itemsFailed > 0 && (
                  <span className="ml-1 text-red-500">({job.itemsFailed} failed)</span>
                )}
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400">
                {job.startedAt
                  ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="light" size="sm">
                  <Link href={`/admin/sync/logs?jobId=${job.id}`}>View Details</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
