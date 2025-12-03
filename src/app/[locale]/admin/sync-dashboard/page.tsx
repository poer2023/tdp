import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SyncStatusDashboard } from "@/components/admin/sync-status-dashboard";

export const metadata: Metadata = {
  title: "Media Sync Dashboard - Admin",
  description: "Monitor and manage media sync jobs",
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SyncDashboardPage({ params }: PageProps) {
  const { locale } = await params;

  // Check authentication
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl dark:text-stone-100">
          📊 Media Sync Dashboard
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Monitor sync jobs, trigger manual syncs, and view media statistics
        </p>
      </div>

      {/* Dashboard */}
      <SyncStatusDashboard />
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
