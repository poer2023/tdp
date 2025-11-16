"use client";

/**
 * Credential Actions Component
 * Validate and sync actions for credentials
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Alert, Spinner } from "@/components/ui-heroui";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { t } from "@/lib/admin-translations";

type CredentialActionsProps = {
  credentialId: string;
  locale: "en" | "zh";
};

export function CredentialActions({ credentialId, locale }: CredentialActionsProps) {
  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setValidationStatus(null);

    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/validate`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        const isValid = data.validation.isValid;
        setValidationStatus({
          type: isValid ? "success" : "error",
          text: isValid
            ? locale === "zh"
              ? `验证成功: ${data.validation.message || "凭据有效"}`
              : `Valid: ${data.validation.message || "Credential is valid"}`
            : locale === "zh"
              ? `验证失败: ${data.validation.error || "凭据无效"}`
              : `Invalid: ${data.validation.error || "Credential is invalid"}`,
        });

        // Refresh page to show updated validation status
        setTimeout(() => router.refresh(), 1500);
      } else {
        setValidationStatus({
          type: "error",
          text: locale === "zh" ? `错误: ${data.error}` : `Error: ${data.error}`,
        });
      }
    } catch (error) {
      setValidationStatus({
        type: "error",
        text:
          locale === "zh"
            ? `验证失败: ${error instanceof Error ? error.message : "未知错误"}`
            : `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/sync`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        const result = data.syncResult;
        setSyncStatus({
          type: "success",
          text:
            locale === "zh"
              ? `同步成功: ${result.message || `${result.itemsSuccess || 0} 项成功`}`
              : `Sync completed: ${result.message || `${result.itemsSuccess || 0} items synced`}`,
        });

        // Refresh page to show updated usage stats
        setTimeout(() => router.refresh(), 1500);
      } else {
        setSyncStatus({
          type: "error",
          text: locale === "zh" ? `错误: ${data.error}` : `Error: ${data.error}`,
        });
      }
    } catch (error) {
      setSyncStatus({
        type: "error",
        text:
          locale === "zh"
            ? `同步失败: ${error instanceof Error ? error.message : "未知错误"}`
            : `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          color="primary"
          onPress={handleValidate}
          isDisabled={validating}
          startContent={
            validating ? <Spinner size="sm" /> : <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          }
        >
          {validating ? (locale === "zh" ? "验证中..." : "Validating...") : t(locale, "validateCredential")}
        </Button>

        <Button
          color="secondary"
          onPress={handleSync}
          isDisabled={syncing}
          startContent={
            syncing ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" strokeWidth={2} />
          }
        >
          {syncing ? (locale === "zh" ? "同步中..." : "Syncing...") : locale === "zh" ? "立即同步" : "Sync Now"}
        </Button>
      </div>

      {validationStatus && (
        <Alert
          status={validationStatus.type === "success" ? "success" : "danger"}
          title={validationStatus.type === "success" ? (locale === "zh" ? "验证成功" : "Validation complete") : locale === "zh" ? "验证失败" : "Validation failed"}
          description={validationStatus.text}
        />
      )}

      {syncStatus && (
        <Alert
          status={syncStatus.type === "success" ? "success" : "danger"}
          title={
            syncStatus.type === "success"
              ? locale === "zh"
                ? "同步成功"
                : "Sync complete"
              : locale === "zh"
                ? "同步失败"
                : "Sync failed"
          }
          description={syncStatus.text}
        />
      )}
    </div>
  );
}
