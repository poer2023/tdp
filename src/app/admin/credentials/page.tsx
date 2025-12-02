/**
 * Admin Credentials Management Page
 * Manage API keys, cookies, and authentication tokens
 *
 * @modular Feature-gated with `FEATURE_ADMIN_CREDENTIALS`
 * @see docs/modular-development-playbook.md
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { CredentialPlatform, CredentialType, type Prisma } from "@prisma/client";
import Link from "next/link";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { CredentialFilters } from "@/components/admin/credential-filters";
import { features } from "@/config/features";
import { ComingSoonFallback } from "@/components/feature-toggle";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { ModuleLoadingSkeleton } from "@/components/error-boundaries/module-error-fallback";

const CredentialsContent = dynamic(
  () =>
    import("@/components/admin/credentials-content").then((mod) => ({
      default: mod.CredentialsContent,
    })),
  { loading: () => <ModuleLoadingSkeleton rows={3} /> }
);

export const revalidate = 0;
export const runtime = "nodejs";

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

type SearchParams = {
  platform?: CredentialPlatform;
  type?: CredentialType;
  status?: "valid" | "invalid";
};

type CredentialsResult = Awaited<ReturnType<typeof prisma.externalCredential.findMany>>;
type PlatformsResult = Array<Pick<CredentialsResult[number], "platform">>;

type CredentialPageData = {
  credentials: CredentialsResult;
  platforms: PlatformsResult;
};

function getFallbackData(): CredentialPageData {
  return {
    credentials: [] as CredentialsResult,
    platforms: [] as PlatformsResult,
  };
}

async function loadCredentialData(
  where: Prisma.ExternalCredentialWhereInput
): Promise<CredentialPageData> {
  if (SKIP_DB) {
    return getFallbackData();
  }

  try {
    const [credentials, platforms] = await Promise.all([
      prisma.externalCredential.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.externalCredential.findMany({
        select: { platform: true },
        distinct: ["platform"],
        orderBy: { platform: "asc" },
      }),
    ]);

    return { credentials, platforms };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to load credential data, falling back to empty state.", error);
    }
    return getFallbackData();
  }
}

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale: AdminLocale = "zh"; // TODO: detect user preference

  if (!features.get("adminCredentials")) {
    return <ComingSoonFallback />;
  }

  const where: Prisma.ExternalCredentialWhereInput = {};
  if (params.platform) where.platform = params.platform;
  if (params.type) where.type = params.type;
  if (params.status === "valid") where.isValid = true;
  if (params.status === "invalid") where.isValid = false;

  const { credentials, platforms } = await loadCredentialData(where);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            {t(locale, "credentials")}
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(locale, "credentialDescription")}
          </p>
        </div>
        <Link
          href="/admin/credentials/new"
          className="admin-primary-btn"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t(locale, "addCredential")}
        </Link>
      </header>

      <CredentialFilters locale={locale} params={params} platforms={platforms} />

      <AdminErrorBoundary>
        <Suspense fallback={<ModuleLoadingSkeleton rows={3} />}>
          <CredentialsContent credentials={credentials} locale={locale} />
        </Suspense>
      </AdminErrorBoundary>
    </div>
  );
}
