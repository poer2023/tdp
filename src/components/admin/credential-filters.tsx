"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CredentialPlatform, CredentialType } from "@prisma/client";
import { adminTranslations, t, type AdminLocale } from "@/lib/admin-translations";
import { Button, Card, CardContent, Chip, Select } from "@/components/ui-heroui";

type SearchParams = {
  platform?: CredentialPlatform;
  type?: CredentialType;
  status?: "valid" | "invalid";
};

type PlatformsResult = Array<{ platform: CredentialPlatform }>;

type Props = {
  locale: AdminLocale;
  params: SearchParams;
  platforms: PlatformsResult;
};

export function CredentialFilters({ locale, params, platforms }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateQuery(key: keyof SearchParams, value: string) {
    const query = new URLSearchParams(searchParams?.toString());

    if (value) {
      query.set(key, value);
    } else {
      query.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${query.toString()}`, { scroll: false });
    });
  }

  const hasFilters = Boolean(params.platform || params.type || params.status);

  return (
    <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              Filters
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t(locale, "filterCredentials")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "credentialDescription")}
            </p>
          </div>
          {hasFilters && (
            <Button
              variant="light"
              size="sm"
              onPress={() =>
                startTransition(() => {
                  router.replace(pathname, { scroll: false });
                })
              }
            >
              {t(locale, "resetFilters") ?? "重置筛选"}
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={params.platform ?? ""} onChange={(value) => updateQuery("platform", value)}>
            <Select.Item id="">{t(locale, "selectPlatform")}</Select.Item>
            {platforms.map(({ platform }) => (
              <Select.Item key={platform} id={platform}>
                {t(locale, platform.toLowerCase() as keyof typeof adminTranslations.en)}
              </Select.Item>
            ))}
          </Select>

          <Select value={params.type ?? ""} onChange={(value) => updateQuery("type", value)}>
            <Select.Item id="">{t(locale, "selectCredentialType")}</Select.Item>
            <Select.Item id="API_KEY">{t(locale, "apiKey")}</Select.Item>
            <Select.Item id="COOKIE">{t(locale, "cookie")}</Select.Item>
            <Select.Item id="OAUTH_TOKEN">{t(locale, "oauthToken")}</Select.Item>
          </Select>

          <Select value={params.status ?? ""} onChange={(value) => updateQuery("status", value)}>
            <Select.Item id="">{t(locale, "credentialStatus")}</Select.Item>
            <Select.Item id="valid">{t(locale, "isValid")}</Select.Item>
            <Select.Item id="invalid">{t(locale, "isInvalid")}</Select.Item>
          </Select>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {params.platform && (
              <Chip size="sm" variant="flat" color="primary">
                {t(locale, "platform")}:{" "}
                {t(locale, params.platform.toLowerCase() as keyof typeof adminTranslations.en)}
              </Chip>
            )}
            {params.type && (
              <Chip size="sm" variant="flat" color="secondary">
                {t(locale, "credentialType")}:{" "}
                {t(
                  locale,
                  params.type === "API_KEY" ? "apiKey" : params.type === "COOKIE" ? "cookie" : "oauthToken"
                )}
              </Chip>
            )}
            {params.status && (
              <Chip size="sm" variant="flat" color={params.status === "valid" ? "success" : "danger"}>
                {t(locale, "credentialStatus")}:{" "}
                {t(locale, params.status === "valid" ? "isValid" : "isInvalid")}
              </Chip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
