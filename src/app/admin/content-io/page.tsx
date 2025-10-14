import Link from "next/link";
import { ActionCard } from "@/components/admin/action-card";

// Keep Node.js runtime to match other admin pages that rely on Prisma via layout auth
export const runtime = "nodejs";

export default function ContentIOPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Content I/O
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Import & Export tools</p>
      </header>

      {/* Actions */}
      <section className="grid gap-6 sm:grid-cols-2">
        <ActionCard
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v12m0 0l-3-3m3 3l3-3M4 21h16"
              />
            </svg>
          }
          title="Import"
          description="Upload a ZIP to create or update posts"
          primaryAction={{ label: "Go to Import", href: "/admin/import" }}
        />

        <ActionCard
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 21V9m0 0l3 3m-3-3l-3 3M4 3h16"
              />
            </svg>
          }
          title="Export"
          description="Download posts as Markdown for backup or migration"
          primaryAction={{ label: "Go to Export", href: "/admin/export" }}
        />
      </section>

      {/* Short help */}
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Looking for details? See docs in{" "}
        <Link href="/admin/export" className="underline">
          Export
        </Link>{" "}
        or{" "}
        <Link href="/admin/import" className="underline">
          Import
        </Link>{" "}
        pages.
      </p>
    </div>
  );
}
