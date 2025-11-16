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
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button, Card, CardContent, Input, Select, Switch, Textarea } from "@/components/ui-heroui";

type CredentialFormProps = {
  action: (formData: FormData) => Promise<void>;
  locale: AdminLocale;
  credential?: ExternalCredential;
};

const PLATFORM_OPTIONS: { value: CredentialPlatform; labelKey: keyof typeof import("@/lib/admin-translations").adminTranslations.en }[] =
  [
    { value: "STEAM", labelKey: "steam" },
    { value: "GITHUB", labelKey: "github" },
    { value: "BILIBILI", labelKey: "bilibili" },
    { value: "DOUBAN", labelKey: "douban" },
    { value: "HOYOVERSE", labelKey: "hoyoverse" },
    { value: "JELLYFIN", labelKey: "jellyfin" },
  ];

const SYNC_OPTIONS = [
  { id: "daily", labelKey: "syncFrequencyDaily" },
  { id: "twice_daily", labelKey: "syncFrequencyTwiceDaily" },
  { id: "three_times_daily", labelKey: "syncFrequencyThreeTimesDaily" },
  { id: "four_times_daily", labelKey: "syncFrequencyFourTimesDaily" },
  { id: "six_times_daily", labelKey: "syncFrequencySixTimesDaily" },
];

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
      <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-6 p-5">
          <Select
            label={t(locale, "credentialPlatform")}
            value={selectedPlatform}
            onChange={(value) => {
              setSelectedPlatform(value as CredentialPlatform);
              setFormValues({});
              setShowInstructions(false);
            }}
            isDisabled={!!credential}
            isRequired
          >
            <Select.Item id="">{t(locale, "selectPlatform")}</Select.Item>
            {PLATFORM_OPTIONS.map((option) => (
              <Select.Item key={option.value} id={option.value}>
                {t(locale, option.labelKey)}
              </Select.Item>
            ))}
          </Select>

          {selectedPlatform && platformConfig && (
            <Card variant="secondary" className="border border-zinc-100 dark:border-zinc-800">
              <CardContent className="space-y-3 p-4">
                <Button
                  type="button"
                  variant="light"
                  className="w-full justify-between"
                  onPress={() => setShowInstructions((prev) => !prev)}
                  startContent={<Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  endContent={
                    showInstructions ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    )
                  }
                >
                  {locale === "zh" ? "如何获取凭据？" : "How to get credentials?"}
                </Button>
                {showInstructions && (
                  <ol className="list-decimal space-y-2 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200">
                    {platformConfig.instructions[locale].map((instruction) => (
                      <li key={instruction} className="pl-2">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}

          {selectedPlatform && platformConfig && (
            <div className="space-y-4">
              {platformConfig.fields.map((field) => {
                const value = formValues[field.name] || "";
                const common = {
                  id: field.name,
                  name: field.name,
                  value,
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setFormValues({ ...formValues, [field.name]: e.target.value }),
                  label: field.label[locale],
                  placeholder: field.placeholder?.[locale],
                  isRequired: field.required,
                };

                if (field.type === "textarea") {
                  return (
                    <Textarea
                      key={field.name}
                      {...common}
                      rows={4}
                      description={field.helperText?.[locale]}
                    />
                  );
                }

                if (field.type === "password") {
                  const visible = passwordVisibility[field.name];
                  return (
                    <div key={field.name} className="space-y-2">
                      <Input
                        {...common}
                        type={visible ? "text" : "password"}
                        inputMode="text"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          onPress={() => togglePasswordVisibility(field.name)}
                        >
                          {visible ? (locale === "zh" ? "隐藏" : "Hide") : locale === "zh" ? "显示" : "Show"}
                        </Button>
                      </div>
                      {field.helperText && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {field.helperText[locale]}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <Input
                    key={field.name}
                    {...common}
                    type={field.type}
                    description={field.helperText?.[locale]}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPlatform && platformConfig && (
        <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {t(locale, "autoSync")}
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t(locale, "autoSyncSettings")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t(locale, "autoSyncDescription")}
              </p>
            </div>

            <Switch
              isSelected={autoSyncEnabled}
              onChange={setAutoSyncEnabled}
              aria-label={t(locale, "enableAutoSync")}
            >
              {t(locale, "enableAutoSync")}
            </Switch>

            {autoSyncEnabled && (
              <Select
                label={t(locale, "syncFrequency")}
                value={syncFrequency}
                onChange={(value) => setSyncFrequency(value)}
              >
                {SYNC_OPTIONS.map((option) => (
                  <Select.Item key={option.id} id={option.id}>
                    {t(locale, option.labelKey as keyof typeof import("@/lib/admin-translations").adminTranslations.en)}
                  </Select.Item>
                ))}
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" color="primary" isDisabled={!selectedPlatform}>
          {t(locale, "saveChanges")}
        </Button>
        <Button variant="light" type="button" onPress={() => router.back()}>
          {t(locale, "cancel")}
        </Button>
      </div>
    </form>
  );
}
