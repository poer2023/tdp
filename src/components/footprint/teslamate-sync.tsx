"use client";

import { useState } from "react";
import { Zap, RefreshCw, Check, AlertCircle, Car } from "lucide-react";

interface TeslaMateSyncProps {
    locale: "zh" | "en";
    onSyncComplete?: () => void;
}

interface SyncResult {
    success: boolean;
    synced: number;
    skipped: number;
    total: number;
    error?: string;
}

export function TeslaMateSync({ locale, onSyncComplete }: TeslaMateSyncProps) {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: "TeslaMate 同步",
                description: "从 TeslaMate 导入驾驶记录",
                sync: "同步数据",
                syncing: "同步中...",
                success: "同步成功",
                failed: "同步失败",
                synced: "已导入",
                skipped: "已跳过",
                total: "总计",
                trips: "条记录",
                useMock: "使用模拟数据",
            },
            en: {
                title: "TeslaMate Sync",
                description: "Import drives from TeslaMate",
                sync: "Sync Data",
                syncing: "Syncing...",
                success: "Sync Complete",
                failed: "Sync Failed",
                synced: "Imported",
                skipped: "Skipped",
                total: "Total",
                trips: "drives",
                useMock: "Use Mock Data",
            },
        };
        return translations[locale]?.[key] || key;
    };

    const handleSync = async (useMock: boolean = false) => {
        setSyncing(true);
        setResult(null);
        setShowResult(false);

        try {
            const url = useMock
                ? "/api/footprint/teslamate?mock=true"
                : "/api/footprint/teslamate";

            const res = await fetch(url, { method: "POST" });
            const data = await res.json();

            setResult(data);
            setShowResult(true);

            if (data.success && onSyncComplete) {
                onSyncComplete();
            }
        } catch (err) {
            setResult({
                success: false,
                synced: 0,
                skipped: 0,
                total: 0,
                error: String(err),
            });
            setShowResult(true);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/30">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                    <Car className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                        {t("title")}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        {t("description")}
                    </p>
                </div>
            </div>

            {/* Sync Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleSync(false)}
                    disabled={syncing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-600 disabled:opacity-50"
                >
                    {syncing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="h-4 w-4" />
                    )}
                    {syncing ? t("syncing") : t("sync")}
                </button>
                <button
                    onClick={() => handleSync(true)}
                    disabled={syncing}
                    className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    title={t("useMock")}
                >
                    <Car className="h-4 w-4" />
                    Mock
                </button>
            </div>

            {/* Result */}
            {showResult && result && (
                <div
                    className={`mt-4 rounded-lg p-3 ${result.success
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                >
                    <div className="flex items-center gap-2 font-medium">
                        {result.success ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        {result.success ? t("success") : t("failed")}
                    </div>
                    {result.success ? (
                        <div className="mt-1 text-sm opacity-80">
                            {t("synced")} {result.synced} / {t("skipped")} {result.skipped} / {t("total")} {result.total} {t("trips")}
                        </div>
                    ) : (
                        <div className="mt-1 text-sm opacity-80">
                            {result.error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
