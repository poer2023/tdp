"use client";

/**
 * Credential Actions Component
 * Validate and sync actions for credentials
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

type CredentialActionsProps = {
  credentialId: string;
  locale: "en" | "zh";
};

export function CredentialActions({ credentialId, locale }: CredentialActionsProps) {
  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const handleValidate = async () => {
    setValidating(true);
    setValidationMessage("");

    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/validate`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setValidationMessage(
          data.validation.isValid
            ? locale === "zh"
              ? `✓ 验证成功: ${data.validation.message || "凭据有效"}`
              : `✓ Valid: ${data.validation.message || "Credential is valid"}`
            : locale === "zh"
              ? `✗ 验证失败: ${data.validation.error || "凭据无效"}`
              : `✗ Invalid: ${data.validation.error || "Credential is invalid"}`
        );

        // Refresh page to show updated validation status
        setTimeout(() => router.refresh(), 1500);
      } else {
        setValidationMessage(locale === "zh" ? `错误: ${data.error}` : `Error: ${data.error}`);
      }
    } catch (error) {
      setValidationMessage(
        locale === "zh"
          ? `验证失败: ${error instanceof Error ? error.message : "未知错误"}`
          : `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/sync`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        const result = data.syncResult;
        setSyncMessage(
          locale === "zh"
            ? `✓ 同步成功: ${result.message || `${result.itemsSuccess || 0} 项成功`}`
            : `✓ Sync completed: ${result.message || `${result.itemsSuccess || 0} items synced`}`
        );

        // Refresh page to show updated usage stats
        setTimeout(() => router.refresh(), 1500);
      } else {
        setSyncMessage(locale === "zh" ? `错误: ${data.error}` : `Error: ${data.error}`);
      }
    } catch (error) {
      setSyncMessage(
        locale === "zh"
          ? `同步失败: ${error instanceof Error ? error.message : "未知错误"}`
          : `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleValidate}
          disabled={validating}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {validating ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {locale === "zh" ? "验证中..." : "Validating..."}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {locale === "zh" ? "验证凭据" : "Validate"}
            </>
          )}
        </button>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-green-400 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {syncing ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {locale === "zh" ? "同步中..." : "Syncing..."}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {locale === "zh" ? "立即同步" : "Sync Now"}
            </>
          )}
        </button>
      </div>

      {validationMessage && (
        <div
          className={`rounded-lg p-3 text-sm ${
            validationMessage.startsWith("✓")
              ? "bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          {validationMessage}
        </div>
      )}

      {syncMessage && (
        <div
          className={`rounded-lg p-3 text-sm ${
            syncMessage.startsWith("✓")
              ? "bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          {syncMessage}
        </div>
      )}
    </div>
  );
}
