/**
 * Admin New Credential Page
 * Create new API keys, cookies, and authentication tokens
 */

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { encryptCredential, isEncrypted } from "@/lib/encryption";
import { CredentialForm } from "@/components/admin/credential-form";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import Link from "next/link";
import { CredentialPlatform, CredentialType } from "@prisma/client";

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

async function createCredential(formData: FormData) {
  "use server";

  const platform = formData.get("platform") as string;
  const type = formData.get("type") as string;
  const value = formData.get("value") as string;
  const metadataStr = formData.get("metadata") as string;
  const autoSyncStr = formData.get("autoSync") as string;
  const syncFrequency = formData.get("syncFrequency") as string;

  // Parse auto-sync settings
  const autoSync = autoSyncStr === "true";

  // Generate ID
  const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  await prisma.externalCredential.create({
    data: {
      id,
      platform: platform as CredentialPlatform,
      type: type as CredentialType,
      value: storedValue,
      metadata,
      isValid: true,
      autoSync,
      syncFrequency: autoSync ? syncFrequency : null,
      nextCheckAt,
      updatedAt: new Date(),
    },
  });

  redirect("/admin/credentials");
}

export default function NewCredentialPage() {
  const locale: AdminLocale = "zh"; // TODO: Get from user preferences

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/admin/credentials" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            {t(locale, "credentials")}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">{t(locale, "addCredential")}</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t(locale, "addCredential")}
        </h1>
      </header>

      {/* Form */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <CredentialForm action={createCredential} locale={locale} />
      </div>
    </div>
  );
}
