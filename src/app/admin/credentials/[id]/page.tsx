/**
 * Admin Edit Credential Page
 * Edit and manage existing credentials
 */

import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { encryptCredential, isEncrypted, decryptCredential } from "@/lib/encryption";
import { CredentialForm } from "@/components/admin/credential-form";
import { CredentialActions } from "@/components/admin/credential-actions";
import { DeleteCredentialButton } from "@/components/admin/delete-credential-button";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import Link from "next/link";
import { CredentialPlatform, CredentialType } from "@prisma/client";
import { Card, CardContent, Chip, Surface } from "@/components/ui-heroui";

export const runtime = "nodejs";

/**
 * Calculate next check time based on sync frequency
 */
function calculateNextCheckTime(frequency: string): Date {
  const now = new Date();
  const hours: Record<string, number> = {
    daily: 24,
    twice_daily: 12,
    three_times_daily: 8,
    four_times_daily: 6,
    six_times_daily: 4,
  };
  const hoursToAdd = hours[frequency] || 24;
  return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
}

async function updateCredential(id: string, formData: FormData) {
  "use server";

  const platform = formData.get("platform") as CredentialPlatform;
  const type = formData.get("type") as CredentialType;
  const value = formData.get("value") as string;
  const metadataStr = formData.get("metadata") as string;
  const autoSyncStr = formData.get("autoSync") as string;
  const syncFrequency = formData.get("syncFrequency") as string;

  // Parse auto-sync settings
  const autoSync = autoSyncStr === "true";

  // Parse metadata
  let metadata = null;
  if (metadataStr && metadataStr.trim()) {
    try {
      metadata = JSON.parse(metadataStr);
    } catch (_error) {
      // Invalid JSON, ignore
    }
  }

  const storedValue = isEncrypted(value) ? value : encryptCredential(value);

  // Calculate next check time if auto-sync is enabled
  const nextCheckAt = autoSync && syncFrequency ? calculateNextCheckTime(syncFrequency) : null;

  await prisma.externalCredential.update({
    where: { id },
    data: {
      platform,
      type,
      value: storedValue,
      metadata,
      autoSync,
      syncFrequency: autoSync ? syncFrequency : null,
      nextCheckAt,
      updatedAt: new Date(),
    },
  });

  redirect("/admin/credentials");
}

async function deleteCredential(id: string) {
  "use server";

  await prisma.externalCredential.delete({
    where: { id },
  });

  redirect("/admin/credentials");
}

export default async function EditCredentialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale: AdminLocale = "zh"; // TODO: Get from user preferences

  const credential = await prisma.externalCredential.findUnique({
    where: { id },
  });

  if (!credential) {
    notFound();
  }

  // Decrypt credential value for form display
  const decryptedCredential = {
    ...credential,
    value: isEncrypted(credential.value) ? decryptCredential(credential.value) : credential.value,
  };

  const updateAction = updateCredential.bind(null, id);
  const deleteAction = deleteCredential.bind(null, id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/admin/credentials" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            {t(locale, "credentials")}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">{t(locale, "editCredential")}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t(locale, "editCredential")}
        </h1>
      </Surface>

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label={t(locale, "credentialCreatedAt")} value={credential.createdAt} />
            <Metric label={t(locale, "credentialUpdatedAt")} value={credential.updatedAt} />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t(locale, "credentialStatus")}
              </p>
              <Chip
                size="sm"
                variant="flat"
                color={credential.isValid ? "success" : "danger"}
                className="font-semibold"
              >
                {credential.isValid ? t(locale, "isValid") : t(locale, "isInvalid")}
              </Chip>
            </div>
            <Metric label={t(locale, "usageCount")} value={credential.usageCount} />
            <Metric label={t(locale, "failureCount")} value={credential.failureCount} />
            {credential.lastValidatedAt && (
              <Metric label={t(locale, "lastValidated")} value={credential.lastValidatedAt} />
            )}
          </div>

          <CredentialForm action={updateAction} locale={locale} credential={decryptedCredential} />
        </CardContent>
      </Card>

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-6 p-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {locale === "zh" ? "操作" : "Actions"}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {locale === "zh"
                ? "验证凭据有效性或触发数据同步"
                : "Validate the credential and trigger manual syncs."}
            </p>
          </div>
          <CredentialActions credentialId={credential.id} locale={locale} />
          <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-4 dark:border-red-900/30 dark:bg-red-950/20">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
              {t(locale, "deleteCredential")}
            </h3>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              {t(locale, "confirmDeleteCredentialDescription")}
            </p>
            <DeleteCredentialButton
              confirmMessage={t(locale, "confirmDeleteCredential")}
              buttonText={t(locale, "deleteCredential")}
              formAction={deleteAction}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: Date | number }) {
  const formatted =
    value instanceof Date ? value.toLocaleString() : typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatted}</p>
    </div>
  );
}
