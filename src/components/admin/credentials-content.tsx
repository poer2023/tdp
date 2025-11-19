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
import { Card, CardContent, Chip } from "@/components/ui-heroui";

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
      <Card variant="default">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, "noCredentials")}</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {t(locale, "createFirstCredential")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {credentials.map((credential) => (
        <Link key={credential.id} href={`/admin/credentials/${credential.id}`} className="block">
          <Card
            variant="secondary"
            className="h-full transform transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between">
                <Chip status="default" size="sm">
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
                </Chip>
                <Chip status={credential.isValid ? "success" : "danger"} size="sm">
                  {credential.isValid ? t(locale, "isValid") : t(locale, "isInvalid")}
                </Chip>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
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

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">{t(locale, "usageCount")}</span>
                  <div className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {credential.usageCount}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">{t(locale, "failureCount")}</span>
                  <div className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {credential.failureCount}
                  </div>
                </div>
              </div>

              {credential.lastValidatedAt && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
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

              {credential.autoSync && (
                <div className="mt-auto border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Chip status="accent" size="sm">
                      {t(locale, "autoSync")}
                    </Chip>
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
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
