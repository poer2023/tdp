"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PostStatus, PostLocale } from "@prisma/client";

export function ExportClient() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    statuses: [] as PostStatus[],
    locales: [] as PostLocale[],
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const statusesParam = searchParams.get("statuses");
    const localesParam = searchParams.get("locales");

    setFilters({
      from: from || "",
      to: to || "",
      statuses: statusesParam
        ? statusesParam.split(",").map((s) => {
            const upper = s.toUpperCase();
            return upper === "DRAFT" ? PostStatus.DRAFT : PostStatus.PUBLISHED;
          })
        : [],
      locales: localesParam
        ? localesParam.split(",").map((l) => {
            const upper = l.toUpperCase();
            return upper === "ZH" ? PostLocale.ZH : PostLocale.EN;
          })
        : [],
    });
  }, [searchParams]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", new Date(filters.from).toISOString());
      if (filters.to) params.set("to", new Date(filters.to).toISOString());
      if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
      if (filters.locales.length > 0) params.set("locales", filters.locales.join(","));

      const res = await fetch(`/api/admin/content/export?${params.toString()}`);

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        alert(`Export failed: ${error.error || "Unknown error"}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleStatus = (status: PostStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleLocale = (locale: PostLocale) => {
    setFilters((prev) => ({
      ...prev,
      locales: prev.locales.includes(locale)
        ? prev.locales.filter((l) => l !== locale)
        : [...prev.locales, locale],
    }));
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Operations</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          内容导出
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          将文章导出为带 YAML Frontmatter 的 Markdown，用于备份或迁移。
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            日期范围
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="from" className="block text-sm text-zinc-600 dark:text-zinc-400">
                From
              </label>
              <input
                type="date"
                id="from"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="to" className="block text-sm text-zinc-600 dark:text-zinc-400">
                To
              </label>
              <input
                type="date"
                id="to"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">留空表示不限制日期</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            状态
          </h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.statuses.includes(PostStatus.PUBLISHED)}
                onChange={() => toggleStatus(PostStatus.PUBLISHED)}
                className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-700"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Published</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.statuses.includes(PostStatus.DRAFT)}
                onChange={() => toggleStatus(PostStatus.DRAFT)}
                className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-700"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Draft</span>
            </label>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">不勾选表示导出所有状态</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            语言
          </h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.locales.includes(PostLocale.EN)}
                onChange={() => toggleLocale(PostLocale.EN)}
                className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-700"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">English</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.locales.includes(PostLocale.ZH)}
                onChange={() => toggleLocale(PostLocale.ZH)}
                className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-700"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Chinese</span>
            </label>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">不勾选表示导出所有语言</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "导出中…" : "开始导出"}
        </button>
      </section>
    </div>
  );
}
