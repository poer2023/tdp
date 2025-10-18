/**
 * Admin Credentials Management Page
 * Manage API keys, cookies, and authentication tokens
 */

import prisma from "@/lib/prisma";
import { CredentialPlatform, CredentialType, type Prisma } from "@prisma/client";
import Link from "next/link";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { CredentialFilters } from "@/components/admin/credential-filters";

export const revalidate = 0;
export const runtime = "nodejs";

type SearchParams = {
  platform?: CredentialPlatform;
  type?: CredentialType;
  status?: "valid" | "invalid";
};

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
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
  const locale: AdminLocale = "zh"; // TODO: Get from user preferences

  // Build where clause for filtering
  const where: Prisma.ExternalCredentialWhereInput = {};
  if (params.platform) where.platform = params.platform;
  if (params.type) where.type = params.type;
  if (params.status === "valid") where.isValid = true;
  if (params.status === "invalid") where.isValid = false;

  const { credentials, platforms } = await loadCredentialData(where);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {t(locale, "credentials")}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t(locale, "credentialDescription")}
          </p>
        </div>
        <Link
          href="/admin/credentials/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t(locale, "addCredential")}
        </Link>
      </header>

      {/* Filters */}
      <CredentialFilters locale={locale} params={params} platforms={platforms} />

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t(locale, "noCredentials")}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {t(locale, "createFirstCredential")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => (
            <Link
              key={credential.id}
              href={`/admin/credentials/${credential.id}`}
              className="group block rounded-lg border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {/* Platform & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {t(locale, credential.platform.toLowerCase() as any)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    credential.isValid
                      ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                  }`}
                >
                  {credential.isValid ? t(locale, "isValid") : t(locale, "isInvalid")}
                </span>
              </div>

              {/* Type */}
              <div className="mt-3">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t(
                    locale,
                    credential.type === "API_KEY"
                      ? "apiKey"
                      : credential.type === "COOKIE"
                        ? "cookie"
                        : "oauthToken"
                  )}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  ID: {credential.id.slice(0, 12)}...
                </p>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {t(locale, "usageCount")}
                  </span>
                  <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {credential.usageCount}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {t(locale, "failureCount")}
                  </span>
                  <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {credential.failureCount}
                  </div>
                </div>
              </div>

              {/* Last Validated */}
              {credential.lastValidatedAt && (
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "lastValidated")}:{" "}
                  {new Date(credential.lastValidatedAt).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
