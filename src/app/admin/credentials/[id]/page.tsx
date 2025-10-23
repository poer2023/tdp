/**
 * Admin Edit Credential Page
 * Edit and manage existing credentials
 */

import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { encryptCredential, isEncrypted } from "@/lib/encryption";
import { CredentialForm } from "@/components/admin/credential-form";
import { CredentialActions } from "@/components/admin/credential-actions";
import { DeleteCredentialButton } from "@/components/admin/delete-credential-button";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import Link from "next/link";
import { CredentialPlatform, CredentialType } from "@prisma/client";

export const runtime = "nodejs";

async function updateCredential(id: string, formData: FormData) {
  "use server";

  const platform = formData.get("platform") as CredentialPlatform;
  const type = formData.get("type") as CredentialType;
  const value = formData.get("value") as string;
  const metadataStr = formData.get("metadata") as string;

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

  await prisma.externalCredential.update({
    where: { id },
    data: {
      platform,
      type,
      value: storedValue,
      metadata,
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

  const updateAction = updateCredential.bind(null, id);
  const deleteAction = deleteCredential.bind(null, id);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/admin/credentials" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            {t(locale, "credentials")}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">{t(locale, "editCredential")}</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t(locale, "editCredential")}
        </h1>
      </header>

      {/* Credential Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "credentialCreatedAt")}
            </span>
            <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {new Date(credential.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "credentialUpdatedAt")}
            </span>
            <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {new Date(credential.updatedAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "credentialStatus")}
            </span>
            <div className="mt-1">
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
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "usageCount")}
            </span>
            <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {credential.usageCount}
            </div>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "failureCount")}
            </span>
            <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {credential.failureCount}
            </div>
          </div>
          {credential.lastValidatedAt && (
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(locale, "lastValidated")}
              </span>
              <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {new Date(credential.lastValidatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <CredentialForm action={updateAction} locale={locale} credential={credential} />
      </div>

      {/* Actions Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {locale === "zh" ? "操作" : "Actions"}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {locale === "zh"
            ? "验证凭据有效性或触发数据同步"
            : "Validate credential or trigger data sync"}
        </p>
        <div className="mt-4">
          <CredentialActions credentialId={id} locale={locale} />
        </div>
      </div>

      {/* Delete Section */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">
          {t(locale, "deleteCredential")}
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {t(locale, "confirmDeleteCredentialDescription")}
        </p>
        <DeleteCredentialButton
          confirmMessage={t(locale, "confirmDeleteCredential")}
          buttonText={t(locale, "deleteCredential")}
          formAction={deleteAction}
        />
      </div>
    </div>
  );
}
