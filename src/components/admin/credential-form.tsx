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
import { Info, Eye, EyeOff } from "lucide-react";
import { Input, Textarea, Select, Button, Checkbox, Accordion, Alert, Card } from "@/components/ui-heroui";

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
      <Select
        label={t(locale, "credentialPlatform")}
        placeholder={t(locale, "selectPlatform")}
        isRequired
        value={selectedPlatform}
        onChange={(value) => {
          setSelectedPlatform(value as CredentialPlatform);
          setFormValues({}); // Reset form values when platform changes
        }}
        isDisabled={!!credential} // Disable platform change when editing
      >
        <Select.Item id="STEAM">{t(locale, "steam")}</Select.Item>
        <Select.Item id="GITHUB">GitHub</Select.Item>
        <Select.Item id="BILIBILI">{t(locale, "bilibili")}</Select.Item>
        <Select.Item id="DOUBAN">{t(locale, "douban")}</Select.Item>
        <Select.Item id="HOYOVERSE">{t(locale, "hoyoverse")}</Select.Item>
        <Select.Item id="JELLYFIN">{t(locale, "jellyfin")}</Select.Item>
      </Select>

      {/* Instructions Panel - Show after platform selection */}
      {selectedPlatform && platformConfig && (
        <Accordion type="single" collapsible>
          <Accordion.Item value="instructions">
            <Accordion.Trigger className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {locale === "zh" ? "如何获取凭据？" : "How to get credentials?"}
                </span>
              </div>
            </Accordion.Trigger>
            <Accordion.Content className="rounded-b-lg border border-t-0 border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {platformConfig.instructions[locale].map((instruction, index) => (
                  <li key={index} className="pl-2">
                    {instruction}
                  </li>
                ))}
              </ol>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Dynamic Platform-Specific Fields */}
      {selectedPlatform && platformConfig && (
        <div className="space-y-4">
          {platformConfig.fields.map((field) => {
            if (field.type === "textarea") {
              return (
                <Textarea
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  label={field.label[locale]}
                  isRequired={field.required}
                  rows={4}
                  value={formValues[field.name] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder?.[locale]}
                  description={field.helperText?.[locale]}
                  className="font-mono"
                />
              );
            } else if (field.type === "password") {
              return (
                <div key={field.name} className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={passwordVisibility[field.name] ? "text" : "password"}
                    label={field.label[locale]}
                    isRequired={field.required}
                    value={formValues[field.name] || ""}
                    onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                    placeholder={field.placeholder?.[locale]}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute top-[38px] right-3 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {passwordVisibility[field.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {field.helperText && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {field.helperText[locale]}
                    </p>
                  )}
                </div>
              );
            } else {
              return (
                <Input
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  label={field.label[locale]}
                  isRequired={field.required}
                  value={formValues[field.name] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder?.[locale]}
                />
              );
            }
          })}
        </div>
      )}

      {/* Auto Sync Settings */}
      {selectedPlatform && platformConfig && (
        <Card className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Card.Content className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t(locale, "autoSyncSettings")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(locale, "autoSyncDescription")}
              </p>
            </div>

            {/* Enable Auto Sync Checkbox */}
            <Checkbox
              id="autoSyncEnabled"
              label={t(locale, "enableAutoSync")}
              isSelected={autoSyncEnabled}
              onChange={setAutoSyncEnabled}
            />

            {/* Sync Frequency Selector - Only show when enabled */}
            {autoSyncEnabled && (
              <Select
                label={t(locale, "syncFrequency")}
                value={syncFrequency}
                onChange={setSyncFrequency}
              >
                <Select.Item id="daily">{t(locale, "syncFrequencyDaily")}</Select.Item>
                <Select.Item id="twice_daily">{t(locale, "syncFrequencyTwiceDaily")}</Select.Item>
                <Select.Item id="three_times_daily">
                  {t(locale, "syncFrequencyThreeTimesDaily")}
                </Select.Item>
                <Select.Item id="four_times_daily">{t(locale, "syncFrequencyFourTimesDaily")}</Select.Item>
                <Select.Item id="six_times_daily">{t(locale, "syncFrequencySixTimesDaily")}</Select.Item>
              </Select>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="solid"
          color="default"
          isDisabled={!selectedPlatform}
        >
          {t(locale, "saveChanges")}
        </Button>
        <Button
          type="button"
          variant="outline"
          color="default"
          onPress={() => router.back()}
        >
          {t(locale, "cancel")}
        </Button>
      </div>
    </form>
  );
}
