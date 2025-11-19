"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExportClientShell } from "../export/export-client-shell";
import { ImportClient } from "@/components/admin/import-client";
import { Surface, Button, Card, CardContent } from "@/components/ui-heroui";

type TabType = "export" | "import" | "backup";

export default function AdminToolsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as TabType) || "export";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/admin/tools?tab=${tab}`, { scroll: false });
  };

  const tabs = [
    { id: "export" as const, label: { en: "Export", zh: "导出" } },
    { id: "import" as const, label: { en: "Import", zh: "导入" } },
    { id: "backup" as const, label: { en: "Backup", zh: "备份" } },
  ];

  return (
    <div className="space-y-6">
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
            Operations
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            工具面板
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">数据导入、导出与备份工具</p>
        </div>
      </Surface>

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="flex flex-wrap gap-3 p-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "solid" : "light"}
              onPress={() => handleTabChange(tab.id)}
            >
              {tab.label.en} / {tab.label.zh}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="py-2">
        {activeTab === "export" && <ExportClientShell />}
        {activeTab === "import" && <ImportClient />}
        {activeTab === "backup" && (
          <Card variant="default" className="border border-dashed border-zinc-300 dark:border-zinc-800">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Backup Feature</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">备份功能开发中，敬请期待。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
