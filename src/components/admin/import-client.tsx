"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/content-import";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Surface,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Alert,
  Chip,
} from "@/components/ui-heroui";

export function ImportClient() {
  const { confirm } = useConfirm();
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyResult, setApplyResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDryRunResult(null);
      setApplyResult(null);
      setError(null);
    }
  };

  const handleDryRun = async () => {
    if (!file) return;

    setIsProcessing(true);
    setDryRunResult(null);
    setApplyResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/content/import?dryRun=true", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Dry-run failed.");
        return;
      }

      const result: ImportResult = await res.json();
      setDryRunResult(result);
    } catch (err) {
      console.error("Dry-run error:", err);
      setError("Dry-run failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!file) return;

    const confirmed = await confirm({
      title: "确认导入内容",
      description: `此操作将创建 ${dryRunResult?.summary.created || 0} 篇新文章，更新 ${
        dryRunResult?.summary.updated || 0
      } 篇现有文章。`,
      confirmText: "确认导入",
      cancelText: "取消",
      variant: "default",
    });
    if (!confirmed) return;

    setIsProcessing(true);
    setApplyResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/content/import?dryRun=false", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Import failed.");
        return;
      }

      const result: ImportResult = await res.json();
      setApplyResult(result);
      setDryRunResult(null);
      setFile(null);
    } catch (err) {
      console.error("Import error:", err);
      setError("Import failed.");
    } finally {
      setIsProcessing(false);
    }
  };

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
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">内容导入</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            上传一个包含 Markdown 文章的 ZIP，先预览再应用更改。
          </p>
        </div>
      </Surface>

      {error && <Alert status="danger" description={error} />}

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
          <CardDescription>仅支持 ZIP 文件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300/80 p-8 text-center dark:border-zinc-700/80">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              data-testid="zip-file-input"
            />
            <Button asChild variant="light">
              <label htmlFor="file-upload" className="cursor-pointer">
                选择 ZIP 文件
              </label>
            </Button>
            {file && (
              <Chip size="sm" variant="flat">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Chip>
            )}
          </div>

          {file && !dryRunResult && !applyResult && (
            <div className="flex flex-col gap-2">
              <Button
                color="primary"
                onPress={handleDryRun}
                isDisabled={isProcessing}
                data-testid="preview-import-button"
              >
                {isProcessing ? "Processing..." : "预览导入"}
              </Button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">验证文件并显示新增/更新条目</p>
            </div>
          )}
        </CardContent>
      </Card>

      {dryRunResult && (
        <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
          <CardHeader>
            <CardTitle>预览结果</CardTitle>
            <CardDescription>确认无误后再应用更改</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Chip variant="flat" color="primary">
                Created {dryRunResult.summary.created}
              </Chip>
              <Chip variant="flat" color="secondary">
                Updated {dryRunResult.summary.updated}
              </Chip>
              <Chip variant="flat">{dryRunResult.summary.skipped} skipped</Chip>
              <Chip variant="flat" color={dryRunResult.summary.errors > 0 ? "danger" : "success"}>
                {dryRunResult.summary.errors} errors
              </Chip>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-100/70 text-xs tracking-[0.2em] text-zinc-500 uppercase dark:bg-zinc-800/50 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800" data-testid="file-list">
                  {dryRunResult.details.map((detail, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {detail.filename}
                      </td>
                      <td className="px-4 py-3">
                        <Chip size="sm" variant="flat">
                          {detail.action}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {detail.post?.title || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {detail.error ? (
                          <span className="text-xs text-red-500" data-testid="error">
                            {detail.error}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">{detail.post?.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dryRunResult.summary.errors === 0 && (
              <Button color="primary" onPress={handleApply} isDisabled={isProcessing}>
                {isProcessing ? "Importing..." : "应用导入"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {applyResult && (
        <Alert
          status="success"
          title="导入完成"
          description={`Created ${applyResult.summary.created}, Updated ${applyResult.summary.updated}`}
        />
      )}

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader>
          <CardTitle>导入格式</CardTitle>
          <CardDescription>遵循 docs/CONTENT_FORMAT.md 文档中的结构</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            ZIP files must follow the structure documented in
            <code className="ml-1 rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
              docs/CONTENT_FORMAT.md
            </code>
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Posts matched by (groupId, locale) if groupId exists</li>
            <li>Otherwise matched by (locale, slug)</li>
            <li>Chinese posts auto-generate pinyin slugs if missing</li>
            <li>Duplicate slugs get -2, -3 suffix</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
