"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/content-import";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyResult, setApplyResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDryRunResult(null);
      setApplyResult(null);
    }
  };

  const handleDryRun = async () => {
    if (!file) return;

    setIsProcessing(true);
    setDryRunResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/content/import?dryRun=true", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Dry-run failed: ${error.error || "Unknown error"}`);
        return;
      }

      const result: ImportResult = await res.json();
      setDryRunResult(result);
    } catch (error) {
      console.error("Dry-run error:", error);
      alert("Dry-run failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!file) return;

    if (
      !confirm(
        `Apply import? This will ${dryRunResult?.summary.created || 0} new posts and update ${dryRunResult?.summary.updated || 0} existing posts.`
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setApplyResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/content/import?dryRun=false", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Import failed: ${error.error || "Unknown error"}`);
        return;
      }

      const result: ImportResult = await res.json();
      setApplyResult(result);
      setDryRunResult(null);
      setFile(null);
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          Import
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Upload a ZIP file containing Markdown posts to create or update content. The system will
          validate and preview changes before applying.
        </p>
      </header>

      {/* Upload Section */}
      <div className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Upload File</h2>
          <div className="border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex cursor-pointer items-center gap-2 border border-zinc-900 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors duration-150 hover:bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Choose ZIP File
            </label>
            {file && (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {file && !dryRunResult && !applyResult && (
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <button
              onClick={handleDryRun}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isProcessing ? "Processing..." : "Preview Import"}
            </button>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Validates the file and shows what will be created or updated
            </p>
          </div>
        )}
      </div>

      {/* Dry-Run Results */}
      {dryRunResult && (
        <div className="max-w-3xl space-y-6">
          <div className="border-l-2 border-zinc-900 pl-6 dark:border-zinc-100">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Preview</h2>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {dryRunResult.summary.created}
                </span>{" "}
                posts will be created
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {dryRunResult.summary.updated}
                </span>{" "}
                posts will be updated
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {dryRunResult.summary.skipped}
                </span>{" "}
                files skipped
              </p>
              {dryRunResult.summary.errors > 0 && (
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {dryRunResult.summary.errors} errors detected
                </p>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">File</th>
                  <th className="pb-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                    Action
                  </th>
                  <th className="pb-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">Title</th>
                  <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {dryRunResult.details.map((detail, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {detail.filename}
                    </td>
                    <td className="py-3 pr-4">
                      <ActionBadge action={detail.action} />
                    </td>
                    <td className="py-3 pr-4 text-zinc-900 dark:text-zinc-100">
                      {detail.post?.title || "-"}
                    </td>
                    <td className="py-3">
                      {detail.error ? (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {detail.error}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          {detail.post?.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Apply Button */}
          {dryRunResult.summary.errors === 0 && (
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {isProcessing ? "Importing..." : "Apply Import"}
              </button>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Execute the import and create/update posts in the database
              </p>
            </div>
          )}
        </div>
      )}

      {/* Apply Results */}
      {applyResult && (
        <div className="max-w-3xl space-y-4 border-l-2 border-zinc-900 pl-6 dark:border-zinc-100">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Import Complete
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-600 dark:text-zinc-400">
              Created {applyResult.summary.created} posts
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Updated {applyResult.summary.updated} posts
            </p>
            {applyResult.summary.errors > 0 && (
              <p className="text-zinc-900 dark:text-zinc-100">
                {applyResult.summary.errors} errors occurred
              </p>
            )}
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="max-w-3xl space-y-4 border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Import Format</h2>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            ZIP files must follow the structure documented in{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
              docs/CONTENT_FORMAT.md
            </code>
          </p>
          <p>Matching rules:</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>Posts matched by (groupId, locale) if groupId exists</li>
            <li>Otherwise matched by (locale, slug)</li>
            <li>Chinese posts auto-generate pinyin slugs if missing</li>
            <li>Duplicate slugs get -2, -3 suffix</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config = {
    create: { label: "Create", className: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" },
    update: { label: "Update", className: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" },
    skip: { label: "Skip", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400" },
    error: { label: "Error", className: "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" },
  };

  const { label, className } = config[action as keyof typeof config] || config.skip;

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
