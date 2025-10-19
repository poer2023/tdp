"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { adminTranslations, t, type AdminLocale } from "@/lib/admin-translations";
import { CredentialPlatform, CredentialType } from "@prisma/client";

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

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={params.platform ?? ""}
        onChange={(event) => updateQuery("platform", event.target.value)}
      >
        <option value="">{t(locale, "selectPlatform")}</option>
        {platforms.map(({ platform }) => (
          <option key={platform} value={platform}>
            {t(locale, platform.toLowerCase() as keyof typeof adminTranslations.en)}
          </option>
        ))}
      </select>

      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={params.type ?? ""}
        onChange={(event) => updateQuery("type", event.target.value)}
      >
        <option value="">{t(locale, "selectCredentialType")}</option>
        <option value="API_KEY">{t(locale, "apiKey")}</option>
        <option value="COOKIE">{t(locale, "cookie")}</option>
        <option value="OAUTH_TOKEN">{t(locale, "oauthToken")}</option>
      </select>

      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={params.status ?? ""}
        onChange={(event) => updateQuery("status", event.target.value)}
      >
        <option value="">{t(locale, "credentialStatus")}</option>
        <option value="valid">{t(locale, "isValid")}</option>
        <option value="invalid">{t(locale, "isInvalid")}</option>
      </select>
    </div>
  );
}
