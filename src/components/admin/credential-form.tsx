"use client";

/**
 * Credential Form Component
 * Form for creating and editing credentials
 */

import { useRouter } from "next/navigation";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import type { ExternalCredential } from "@prisma/client";

type CredentialFormProps = {
  action: (formData: FormData) => Promise<void>;
  locale: AdminLocale;
  credential?: ExternalCredential;
};

export function CredentialForm({ action, locale, credential }: CredentialFormProps) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        await action(formData);
      }}
      className="space-y-6"
    >
      {/* Platform */}
      <div>
        <label
          htmlFor="platform"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t(locale, "credentialPlatform")}
        </label>
        <select
          id="platform"
          name="platform"
          required
          defaultValue={credential?.platform || ""}
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        >
          <option value="" disabled>
            {t(locale, "selectPlatform")}
          </option>
          <option value="STEAM">{t(locale, "steam")}</option>
          <option value="HOYOVERSE">{t(locale, "hoyoverse")}</option>
          <option value="BILIBILI">{t(locale, "bilibili")}</option>
          <option value="DOUBAN">{t(locale, "douban")}</option>
          <option value="JELLYFIN">{t(locale, "jellyfin")}</option>
        </select>
      </div>

      {/* Type */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t(locale, "credentialType")}
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={credential?.type || ""}
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        >
          <option value="" disabled>
            {t(locale, "selectCredentialType")}
          </option>
          <option value="API_KEY">{t(locale, "apiKey")}</option>
          <option value="COOKIE">{t(locale, "cookie")}</option>
          <option value="OAUTH_TOKEN">{t(locale, "oauthToken")}</option>
        </select>
      </div>

      {/* Value */}
      <div>
        <label
          htmlFor="value"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t(locale, "credentialValue")}
        </label>
        <textarea
          id="value"
          name="value"
          required
          rows={6}
          defaultValue={credential?.value || ""}
          placeholder={t(locale, "credentialValuePlaceholder")}
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t(locale, "enterCredentialValue")}
        </p>
      </div>

      {/* Metadata (Optional JSON) */}
      <div>
        <label
          htmlFor="metadata"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t(locale, "credentialMetadata")}
        </label>
        <textarea
          id="metadata"
          name="metadata"
          rows={4}
          defaultValue={credential?.metadata ? JSON.stringify(credential.metadata, null, 2) : ""}
          placeholder={t(locale, "optionalMetadata")}
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t(locale, "optionalMetadata")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t(locale, "saveChanges")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t(locale, "cancel")}
        </button>
      </div>
    </form>
  );
}
