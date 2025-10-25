/**
 * Credentials Content Component
 *
 * Client component for displaying and filtering credentials.
 * Separated from server component to enable dynamic loading.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import Link from "next/link";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import type { CredentialPlatform, CredentialType } from "@prisma/client";

type Credential = {
  id: string;
  platform: CredentialPlatform;
  type: CredentialType;
  isValid: boolean;
  usageCount: number;
  failureCount: number;
  lastValidatedAt: Date | null;
  autoSync: boolean;
  syncFrequency: string | null;
  nextCheckAt: Date | null;
};

type CredentialsContentProps = {
  credentials: Credential[];
  locale: AdminLocale;
};

export function CredentialsContent({ credentials, locale }: CredentialsContentProps) {
  if (credentials.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, "noCredentials")}</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {t(locale, "createFirstCredential")}
        </p>
      </div>
    );
  }

  return (
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
                {t(
                  locale,
                  credential.platform.toLowerCase() as
                    | "steam"
                    | "github"
                    | "bilibili"
                    | "douban"
                    | "hoyoverse"
                    | "jellyfin"
                )}
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
              <span className="text-zinc-500 dark:text-zinc-400">{t(locale, "usageCount")}</span>
              <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                {credential.usageCount}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">{t(locale, "failureCount")}</span>
              <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                {credential.failureCount}
              </div>
            </div>
          </div>

          {/* Last Validated */}
          {credential.lastValidatedAt && (
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "lastValidated")}:{" "}
              {new Date(credential.lastValidatedAt).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en-US",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              )}
            </div>
          )}

          {/* Auto Sync Status */}
          {credential.autoSync && (
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">
                  {t(locale, "autoSync")}
                </span>
                {credential.syncFrequency && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(
                      locale,
                      `syncFrequency${credential.syncFrequency
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(
                          ""
                        )}` as keyof typeof import("@/lib/admin-translations").adminTranslations.en
                    )}
                  </span>
                )}
              </div>
              {credential.nextCheckAt && (
                <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "nextSyncAt")}:{" "}
                  {new Date(credential.nextCheckAt).toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
