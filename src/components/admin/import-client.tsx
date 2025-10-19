"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/content-import";

export function ImportClient() {
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
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Operations</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          内容导入
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          上传一个包含 Markdown 文章的 ZIP，先预览再应用更改。
        </p>
      </header>

      {/* Upload Section */}
      <section className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          上传文件
        </h2>
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300/80 p-8 text-center dark:border-zinc-700/70">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            data-testid="zip-file-input"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            选择 ZIP 文件
          </label>
          {file && (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              已选择：{file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {file && !dryRunResult && !applyResult && (
          <div className="mt-6">
            <button
              onClick={handleDryRun}
              disabled={isProcessing}
              data-testid="preview-import-button"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isProcessing ? "Processing..." : "预览导入"}
            </button>
            <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
              验证文件并显示将要新增或更新的内容
            </p>
          </div>
        )}
      </section>

      {/* Dry-Run Results */}
      {dryRunResult && (
        <section className="space-y-6 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            预览
          </h2>
          <div className="space-y-2 text-sm" data-testid="import-stats">
            <p className="text-zinc-600 dark:text-zinc-400">
              <span
                className="font-medium text-zinc-900 dark:text-zinc-100"
                data-testid="created-count"
              >
                {dryRunResult.summary.created}
              </span>{" "}
              posts will be created
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              <span
                className="font-medium text-zinc-900 dark:text-zinc-100"
                data-testid="updated-count"
              >
                {dryRunResult.summary.updated}
              </span>{" "}
              posts will be updated
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              <span
                className="font-medium text-zinc-900 dark:text-zinc-100"
                data-testid="skipped-count"
              >
                {dryRunResult.summary.skipped}
              </span>{" "}
              files skipped
            </p>
            {dryRunResult.summary.errors > 0 && (
              <p className="font-medium text-zinc-900 dark:text-zinc-100" data-testid="error-count">
                {dryRunResult.summary.errors} errors detected
              </p>
            )}
          </div>

          {/* Details Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/30 dark:border-zinc-800/60 dark:bg-zinc-900/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100/70 text-xs tracking-[0.2em] text-zinc-500 uppercase dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-zinc-200 dark:divide-zinc-800"
                data-testid="file-list"
              >
                {dryRunResult.details.map((detail, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {detail.filename}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={detail.action} />
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {detail.post?.title || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {detail.error ? (
                        <span
                          className="text-xs text-zinc-600 dark:text-zinc-400"
                          data-testid="error"
                        >
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
            <div>
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {isProcessing ? "Importing..." : "应用导入"}
              </button>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">将更改写入数据库</p>
            </div>
          )}
        </section>
      )}

      {/* Apply Results */}
      {applyResult && (
        <section className="space-y-2 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            导入完成
          </h2>
          <div className="text-sm">
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
        </section>
      )}

      {/* Documentation */}
      <section className="space-y-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          导入格式
        </h2>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            ZIP files must follow the structure documented in
            <code className="ml-1 rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
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
      </section>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config = {
    create: {
      label: "Create",
      className: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
    },
    update: {
      label: "Update",
      className: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    },
    skip: {
      label: "Skip",
      className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
    },
    error: {
      label: "Error",
      className: "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
    },
  };

  const { label, className } = config[action as keyof typeof config] || config.skip;

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
