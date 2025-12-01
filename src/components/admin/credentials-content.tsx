/**
 * Credentials Content Component
 *
 * Client component for displaying and filtering credentials.
 * Separated from server component to enable dynamic loading.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import Link from "next/link";
import { t } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import type { CredentialPlatform, CredentialType } from "@prisma/client";
import {
  LuminaListContainer,
  LuminaBadge,
  LuminaEmptyState,
} from "./lumina-shared";

type Credential = {
  id: string;
  platform: CredentialPlatform;
  type: CredentialType;
  isValid: boolean;
  usageCount: number;
  failureCount: number;
  lastValidatedAt: Date | null;
  autoSync: boolean;
  syncFrequency: string | null;
  nextCheckAt: Date | null;
};

type CredentialsContentProps = {
  credentials: Credential[];
  locale: AdminLocale;
};

// Platform icon component
function PlatformIcon({ platform }: { platform: CredentialPlatform }) {
  const iconClass = "h-5 w-5";

  switch (platform) {
    case "STEAM":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10c-4.6 0-8.45-3.08-9.64-7.27l3.83 1.58a2.84 2.84 0 002.78 2.27c1.56 0 2.83-1.27 2.83-2.83v-.13l3.4-2.43h.08a3.78 3.78 0 100-7.55 3.79 3.79 0 00-3.77 3.78v.05l-2.4 3.42a2.87 2.87 0 00-1.33-.32l-.26.01L3.63 4.94A10 10 0 0112 2zm-.97 13.13l1.22.5a2.13 2.13 0 01-1.2 1.07 2.12 2.12 0 01-2.77-1.17 2.14 2.14 0 011.17-2.78l1.35.56a.85.85 0 10.23.82zm5.72-6.06a2.52 2.52 0 11-5.04 0 2.52 2.52 0 015.04 0z"/>
        </svg>
      );
    case "GITHUB":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      );
    case "BILIBILI":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
        </svg>
      );
    case "DOUBAN":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M.643 4.286h22.714V6H.643V4.286zm3.428 3.428h15.857V22H4.07V7.714zM6 9.429V20h12V9.429H6zm-3.857 12h19.714v1.714H2.143V21.43zm4.286-6h11.142v1.714H6.429v-1.714zM.643 2.571h22.714v1.714H.643V2.57z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
  }
}

export function CredentialsContent({ credentials, locale }: CredentialsContentProps) {
  if (credentials.length === 0) {
    return (
      <LuminaEmptyState
        icon={
          <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
        title={t(locale, "noCredentials")}
        description={t(locale, "createFirstCredential")}
      />
    );
  }

  return (
    <LuminaListContainer>
      {credentials.map((credential) => (
        <Link
          key={credential.id}
          href={`/admin/credentials/${credential.id}`}
          className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-800"
        >
          {/* Platform Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            <PlatformIcon platform={credential.platform} />
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-stone-800 dark:text-stone-100">
                {t(
                  locale,
                  credential.platform.toLowerCase() as
                    | "steam"
                    | "github"
                    | "bilibili"
                    | "douban"
                    | "hoyoverse"
                    | "jellyfin"
                )}
              </h3>
              <LuminaBadge variant={credential.isValid ? "success" : "error"}>
                {credential.isValid ? t(locale, "isValid") : t(locale, "isInvalid")}
              </LuminaBadge>
              {credential.autoSync && (
                <LuminaBadge variant="info">
                  {t(locale, "autoSync")}
                </LuminaBadge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
              {t(
                locale,
                credential.type === "API_KEY"
                  ? "apiKey"
                  : credential.type === "COOKIE"
                    ? "cookie"
                    : "oauthToken"
              )}{" "}
              · ID: {credential.id.slice(0, 8)}...
            </p>
          </div>

          {/* Stats */}
          <div className="hidden shrink-0 items-center gap-6 text-xs sm:flex">
            <div className="text-center">
              <div className="font-medium text-stone-900 dark:text-stone-100">
                {credential.usageCount}
              </div>
              <div className="text-stone-500 dark:text-stone-400">
                {t(locale, "usageCount")}
              </div>
            </div>
            <div className="text-center">
              <div className={`font-medium ${credential.failureCount > 0 ? "text-red-600 dark:text-red-400" : "text-stone-900 dark:text-stone-100"}`}>
                {credential.failureCount}
              </div>
              <div className="text-stone-500 dark:text-stone-400">
                {t(locale, "failureCount")}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 text-stone-400 dark:text-stone-500">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </div>
        </Link>
      ))}
    </LuminaListContainer>
  );
}
