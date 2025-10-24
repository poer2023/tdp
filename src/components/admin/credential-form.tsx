"use client";

/**
 * Credential Form Component
 * Platform-specific form for creating and editing credentials
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import type { ExternalCredential, CredentialPlatform } from "@prisma/client";
import {
  PLATFORM_CONFIGS,
  assembleCredentialData,
  extractCredentialFormValues,
} from "@/lib/credential-configs";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

type CredentialFormProps = {
  action: (formData: FormData) => Promise<void>;
  locale: AdminLocale;
  credential?: ExternalCredential;
};

export function CredentialForm({ action, locale, credential }: CredentialFormProps) {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<CredentialPlatform | "">(
    credential?.platform || ""
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(credential?.autoSync || false);
  const [syncFrequency, setSyncFrequency] = useState<string>(credential?.syncFrequency || "daily");

  // Initialize form values when editing existing credential
  useEffect(() => {
    if (credential && selectedPlatform) {
      const extracted = extractCredentialFormValues(
        selectedPlatform as CredentialPlatform,
        credential
      );
      setFormValues(extracted);
      setAutoSyncEnabled(credential.autoSync || false);
      setSyncFrequency(credential.syncFrequency || "daily");
    }
  }, [credential, selectedPlatform]);

  const platformConfig = selectedPlatform
    ? PLATFORM_CONFIGS[selectedPlatform as CredentialPlatform]
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedPlatform) {
      alert(locale === "zh" ? "请选择平台" : "Please select a platform");
      return;
    }

    // Assemble credential data from form values
    const { type, value, metadata } = assembleCredentialData(
      selectedPlatform as CredentialPlatform,
      formValues
    );

    // Create FormData with assembled values
    const formData = new FormData();
    formData.append("platform", selectedPlatform);
    formData.append("type", type);
    formData.append("value", value);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    // Add auto-sync settings
    formData.append("autoSync", String(autoSyncEnabled));
    if (autoSyncEnabled) {
      formData.append("syncFrequency", syncFrequency);
    }

    await action(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform Selection */}
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
          value={selectedPlatform}
          onChange={(e) => {
            setSelectedPlatform(e.target.value as CredentialPlatform);
            setFormValues({}); // Reset form values when platform changes
            setShowInstructions(false);
          }}
          disabled={!!credential} // Disable platform change when editing
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        >
          <option value="" disabled>
            {t(locale, "selectPlatform")}
          </option>
          <option value="STEAM">{t(locale, "steam")}</option>
          <option value="GITHUB">GitHub</option>
          <option value="BILIBILI">{t(locale, "bilibili")}</option>
          <option value="DOUBAN">{t(locale, "douban")}</option>
          <option value="HOYOVERSE">{t(locale, "hoyoverse")}</option>
          <option value="JELLYFIN">{t(locale, "jellyfin")}</option>
        </select>
      </div>

      {/* Instructions Panel - Show after platform selection */}
      {selectedPlatform && platformConfig && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {locale === "zh" ? "如何获取凭据？" : "How to get credentials?"}
              </span>
            </div>
            {showInstructions ? (
              <ChevronUp className="h-5 w-5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-500" />
            )}
          </button>

          {showInstructions && (
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {platformConfig.instructions[locale].map((instruction, index) => (
                  <li key={index} className="pl-2">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Platform-Specific Fields */}
      {selectedPlatform && platformConfig && (
        <div className="space-y-4">
          {platformConfig.fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {field.label[locale]}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  rows={4}
                  value={formValues[field.name] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder?.[locale]}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  value={formValues[field.name] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder?.[locale]}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                />
              )}
              {field.helperText && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {field.helperText[locale]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto Sync Settings */}
      {selectedPlatform && platformConfig && (
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t(locale, "autoSyncSettings")}
          </h3>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            {t(locale, "autoSyncDescription")}
          </p>

          {/* Enable Auto Sync Checkbox */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSyncEnabled"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-50"
            />
            <label htmlFor="autoSyncEnabled" className="text-sm text-zinc-700 dark:text-zinc-300">
              {t(locale, "enableAutoSync")}
            </label>
          </div>

          {/* Sync Frequency Selector - Only show when enabled */}
          {autoSyncEnabled && (
            <div>
              <label
                htmlFor="syncFrequency"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t(locale, "syncFrequency")}
              </label>
              <select
                id="syncFrequency"
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              >
                <option value="daily">{t(locale, "syncFrequencyDaily")}</option>
                <option value="twice_daily">{t(locale, "syncFrequencyTwiceDaily")}</option>
                <option value="three_times_daily">
                  {t(locale, "syncFrequencyThreeTimesDaily")}
                </option>
                <option value="four_times_daily">{t(locale, "syncFrequencyFourTimesDaily")}</option>
                <option value="six_times_daily">{t(locale, "syncFrequencySixTimesDaily")}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!selectedPlatform}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
