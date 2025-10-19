"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExportClientShell } from "../export/export-client-shell";
import ImportPage from "../import/page";

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
        <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
        <p className="text-muted-foreground">数据导入、导出和备份工具</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-border border-b">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:border-border hover:text-foreground border-transparent"
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
        {activeTab === "import" && <ImportPage />}
        {activeTab === "backup" && (
          <div className="border-border bg-muted/50 rounded-lg border p-8 text-center">
            <h3 className="text-lg font-semibold">Backup Feature</h3>
            <p className="text-muted-foreground mt-2 text-sm">备份功能开发中,敬请期待</p>
          </div>
        )}
      </div>
    </div>
  );
}
