/**
 * Admin New Credential Page
 * Create new API keys, cookies, and authentication tokens
 */

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CredentialForm } from "@/components/admin/credential-form";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import Link from "next/link";

export const runtime = "nodejs";

async function createCredential(formData: FormData) {
  "use server";

  const platform = formData.get("platform") as string;
  const type = formData.get("type") as string;
  const value = formData.get("value") as string;
  const metadataStr = formData.get("metadata") as string;

  // Generate ID
  const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Parse metadata
  let metadata = null;
  if (metadataStr && metadataStr.trim()) {
    try {
      metadata = JSON.parse(metadataStr);
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  await prisma.externalCredential.create({
    data: {
      id,
      platform: platform as any,
      type: type as any,
      value,
      metadata,
      isValid: true,
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
