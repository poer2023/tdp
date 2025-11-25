"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/content-import";
import { useConfirm } from "@/hooks/use-confirm";

export function ImportClient() {
  const { confirm } = useConfirm();
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

    const confirmed = await confirm({
      title: "确认导入内容",
      description: `此操作将创建 ${dryRunResult?.summary.created || 0} 篇新文章，更新 ${dryRunResult?.summary.updated || 0} 篇现有文章。`,
      confirmText: "确认导入",
      cancelText: "取消",
      variant: "default",
    });
    if (!confirmed) return;

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
        <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Operations</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
          内容导入
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          上传一个包含 Markdown 文章的 ZIP，先预览再应用更改。
        </p>
      </header>

      {/* Upload Section */}
      <section className="rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800/70 dark:bg-stone-900/70">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
          上传文件
        </h2>
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300/80 p-8 text-center dark:border-stone-700/70">
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            选择 ZIP 文件
          </label>
          {file && (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
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
              className="inline-flex items-center gap-2 rounded-lg border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
            >
              {isProcessing ? "Processing..." : "预览导入"}
            </button>
            <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
              验证文件并显示将要新增或更新的内容
            </p>
          </div>
        )}
      </section>

      {/* Dry-Run Results */}
      {dryRunResult && (
        <section className="space-y-6 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800/70 dark:bg-stone-900/70">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
            预览
          </h2>
          <div className="space-y-2 text-sm" data-testid="import-stats">
            <p className="text-stone-600 dark:text-stone-400">
              <span
                className="font-medium text-stone-900 dark:text-stone-100"
                data-testid="created-count"
              >
                {dryRunResult.summary.created}
              </span>{" "}
              posts will be created
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              <span
                className="font-medium text-stone-900 dark:text-stone-100"
                data-testid="updated-count"
              >
                {dryRunResult.summary.updated}
              </span>{" "}
              posts will be updated
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              <span
                className="font-medium text-stone-900 dark:text-stone-100"
                data-testid="skipped-count"
              >
                {dryRunResult.summary.skipped}
              </span>{" "}
              files skipped
            </p>
            {dryRunResult.summary.errors > 0 && (
              <p className="font-medium text-stone-900 dark:text-stone-100" data-testid="error-count">
                {dryRunResult.summary.errors} errors detected
              </p>
            )}
          </div>

          {/* Details Table */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white/30 dark:border-stone-800/60 dark:bg-stone-900/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100/70 text-xs tracking-[0.2em] text-stone-500 uppercase dark:bg-stone-800/50 dark:text-stone-400">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-stone-200 dark:divide-stone-800"
                data-testid="file-list"
              >
                {dryRunResult.details.map((detail, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-600 dark:text-stone-400">
                      {detail.filename}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={detail.action} />
                    </td>
                    <td className="px-4 py-3 text-stone-900 dark:text-stone-100">
                      {detail.post?.title || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {detail.error ? (
                        <span
                          className="text-xs text-stone-600 dark:text-stone-400"
                          data-testid="error"
                        >
                          {detail.error}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500 dark:text-stone-500">
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
                className="inline-flex items-center gap-2 rounded-lg border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              >
                {isProcessing ? "Importing..." : "应用导入"}
              </button>
              <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">将更改写入数据库</p>
            </div>
          )}
        </section>
      )}

      {/* Apply Results */}
      {applyResult && (
        <section className="space-y-2 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800/70 dark:bg-stone-900/70">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
            导入完成
          </h2>
          <div className="text-sm">
            <p className="text-stone-600 dark:text-stone-400">
              Created {applyResult.summary.created} posts
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              Updated {applyResult.summary.updated} posts
            </p>
            {applyResult.summary.errors > 0 && (
              <p className="text-stone-900 dark:text-stone-100">
                {applyResult.summary.errors} errors occurred
              </p>
            )}
          </div>
        </section>
      )}

      {/* Documentation */}
      <section className="space-y-4 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800/70 dark:bg-stone-900/70">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
          导入格式
        </h2>
        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
          <p>
            ZIP files must follow the structure documented in
            <code className="ml-1 rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-900">
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
      className: "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900",
    },
    update: {
      label: "Update",
      className: "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100",
    },
    skip: {
      label: "Skip",
      className: "bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400",
    },
    error: {
      label: "Error",
      className: "bg-stone-100 text-stone-900 dark:bg-stone-900 dark:text-stone-100",
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
