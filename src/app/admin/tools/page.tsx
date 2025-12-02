"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExportClientShell } from "../export/export-client-shell";
import { ImportClient } from "@/components/admin/import-client";

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Tools
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          数据导入、导出和备份工具
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100"
                  : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-300"
              } `}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label.en} / {tab.label.zh}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "export" && <ExportClientShell />}
        {activeTab === "import" && <ImportClient />}
        {activeTab === "backup" && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-800 dark:bg-stone-900/50">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Backup Feature
            </h3>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              备份功能开发中,敬请期待
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
