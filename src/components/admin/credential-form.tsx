"use client";

/**
 * Credential Form Component
 * Platform-specific form for creating and editing credentials
 */

import { startTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import type { ExternalCredential, CredentialPlatform } from "@prisma/client";
import {
  PLATFORM_CONFIGS,
  assembleCredentialData,
  extractCredentialFormValues,
} from "@/lib/credential-configs";
import { ChevronDown, ChevronUp, Info, Eye, EyeOff } from "lucide-react";

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
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(credential?.autoSync ?? true);
  const [syncFrequency, setSyncFrequency] = useState<string>(credential?.syncFrequency || "daily");
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});

  // Initialize form values when editing existing credential
  useEffect(() => {
    if (credential && selectedPlatform) {
      startTransition(() => {
        const extracted = extractCredentialFormValues(
          selectedPlatform as CredentialPlatform,
          credential
        );
        setFormValues(extracted);
        setAutoSyncEnabled(credential.autoSync || false);
        setSyncFrequency(credential.syncFrequency || "daily");
      });
    }
  }, [credential, selectedPlatform]);

  const platformConfig = selectedPlatform
    ? PLATFORM_CONFIGS[selectedPlatform as CredentialPlatform]
    : null;

  const togglePasswordVisibility = (fieldName: string) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

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
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
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
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-50 dark:focus:ring-stone-50"
        >
          <option value="" disabled>
            {t(locale, "selectPlatform")}
          </option>
          <option value="STEAM">{t(locale, "steam")}</option>
          <option value="GITHUB">{t(locale, "github")}</option>
          <option value="BILIBILI">{t(locale, "bilibili")}</option>
          <option value="DOUBAN">{t(locale, "douban")}</option>
          <option value="HOYOVERSE">{t(locale, "hoyoverse")}</option>
          <option value="JELLYFIN">{t(locale, "jellyfin")}</option>
          <option value="DEEPSEEK">{t(locale, "deepseek")}</option>
        </select>
      </div>

      {/* Instructions Panel - Show after platform selection */}
      {selectedPlatform && platformConfig && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-sage-600 dark:text-sage-400" />
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {locale === "zh" ? "如何获取凭据？" : "How to get credentials?"}
              </span>
            </div>
            {showInstructions ? (
              <ChevronUp className="h-5 w-5 text-stone-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-stone-500" />
            )}
          </button>

          {showInstructions && (
            <div className="border-t border-stone-200 p-4 dark:border-stone-800">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700 dark:text-stone-300">
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
                className="block text-sm font-medium text-stone-700 dark:text-stone-300"
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
                  className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-50 dark:focus:ring-stone-50"
                />
              ) : field.type === "password" ? (
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type={passwordVisibility[field.name] ? "text" : "password"}
                    required={field.required}
                    value={formValues[field.name] || ""}
                    onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                    placeholder={field.placeholder?.[locale]}
                    className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 pr-10 text-sm focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-50 dark:focus:ring-stone-50"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                  >
                    {passwordVisibility[field.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  value={formValues[field.name] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder?.[locale]}
                  className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-50 dark:focus:ring-stone-50"
                />
              )}
              {field.helperText && (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {field.helperText[locale]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto Sync Settings */}
      {selectedPlatform && platformConfig && (
        <div className="border-t border-stone-200 pt-6 dark:border-stone-800">
          <h3 className="mb-4 text-sm font-medium text-stone-900 dark:text-stone-100">
            {t(locale, "autoSyncSettings")}
          </h3>
          <p className="mb-4 text-xs text-stone-500 dark:text-stone-400">
            {t(locale, "autoSyncDescription")}
          </p>

          {/* Enable Auto Sync Checkbox */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSyncEnabled"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-stone-50"
            />
            <label htmlFor="autoSyncEnabled" className="text-sm text-stone-700 dark:text-stone-300">
              {t(locale, "enableAutoSync")}
            </label>
          </div>

          {/* Sync Frequency Selector - Only show when enabled */}
          {autoSyncEnabled && (
            <div>
              <label
                htmlFor="syncFrequency"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                {t(locale, "syncFrequency")}
              </label>
              <select
                id="syncFrequency"
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-50 dark:focus:ring-stone-50"
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
          className="admin-primary-btn"
        >
          {t(locale, "saveChanges")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-900"
        >
          {t(locale, "cancel")}
        </button>
      </div>
    </form>
  );
}
