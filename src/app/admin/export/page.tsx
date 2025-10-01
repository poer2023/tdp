"use client";

import { useState } from "react";
import { PostStatus, PostLocale } from "@prisma/client";

export default function ExportPage() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    statuses: [] as PostStatus[],
    locales: [] as PostLocale[],
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.from) params.set("from", new Date(filters.from).toISOString());
      if (filters.to) params.set("to", new Date(filters.to).toISOString());
      if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
      if (filters.locales.length > 0) params.set("locales", filters.locales.join(","));

      // Fetch export
      const res = await fetch(`/api/admin/content/export?${params.toString()}`);

      if (!res.ok) {
        const error = await res.json();
        alert(`Export failed: ${error.error || "Unknown error"}`);
        return;
      }

      // Download file
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
      {/* Page Header */}
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          Export
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Download posts as Markdown files with frontmatter. Useful for version control, backup, or
          migration to other platforms.
        </p>
      </header>

      {/* Export Form */}
      <div className="max-w-3xl space-y-8">
        {/* Date Range */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Date Range</h2>
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
                className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors duration-150 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
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
                className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors duration-150 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Leave empty to export all posts regardless of date
          </p>
        </div>

        {/* Status Filter */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Status</h2>
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
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Leave unchecked to export all statuses
          </p>
        </div>

        {/* Locale Filter */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Language</h2>
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
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Leave unchecked to export all languages
          </p>
        </div>

        {/* Export Button */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isExporting ? "Exporting..." : "Export Content"}
          </button>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Downloads a ZIP file containing Markdown files and manifest.json
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="max-w-3xl space-y-4 border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Export Format
        </h2>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Exported files follow the Markdown format specification documented in{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
              docs/CONTENT_FORMAT.md
            </code>
          </p>
          <p>Structure:</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                content/en/*.md
              </code>{" "}
              - English posts
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                content/zh/*.md
              </code>{" "}
              - Chinese posts
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                manifest.json
              </code>{" "}
              - Export metadata
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
