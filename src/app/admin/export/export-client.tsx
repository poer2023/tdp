"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PostStatus, PostLocale } from "@prisma/client";
import {
  Surface,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Checkbox,
  Button,
  Alert,
  Chip,
} from "@/components/ui-heroui";

export function ExportClient() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    statuses: [] as PostStatus[],
    locales: [] as PostLocale[],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", new Date(filters.from).toISOString());
      if (filters.to) params.set("to", new Date(filters.to).toISOString());
      if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
      if (filters.locales.length > 0) params.set("locales", filters.locales.join(","));

      const res = await fetch(`/api/admin/content/export?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Export failed.");
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
    } catch (err) {
      console.error("Export error:", err);
      setError("Export failed. Please try again.");
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
    <div className="space-y-6">
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
            Operations
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">内容导出</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            将文章导出为带 YAML Frontmatter 的 Markdown，用于备份或迁移。
          </p>
        </div>
      </Surface>

      {error && <Alert status="danger" description={error} />}

      <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader>
          <CardTitle>日期范围</CardTitle>
          <CardDescription>留空表示不限制日期</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader>
          <CardTitle>状态</CardTitle>
          <CardDescription>不勾选表示导出所有状态</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Checkbox
            isSelected={filters.statuses.includes(PostStatus.PUBLISHED)}
            onChange={() => toggleStatus(PostStatus.PUBLISHED)}
          >
            Published
          </Checkbox>
          <Checkbox
            isSelected={filters.statuses.includes(PostStatus.DRAFT)}
            onChange={() => toggleStatus(PostStatus.DRAFT)}
          >
            Draft
          </Checkbox>
        </CardContent>
      </Card>

      <Card variant="secondary" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader>
          <CardTitle>语言</CardTitle>
          <CardDescription>不勾选表示导出所有语言</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Checkbox
            isSelected={filters.locales.includes(PostLocale.EN)}
            onChange={() => toggleLocale(PostLocale.EN)}
          >
            English
          </Checkbox>
          <Checkbox
            isSelected={filters.locales.includes(PostLocale.ZH)}
            onChange={() => toggleLocale(PostLocale.ZH)}
          >
            Chinese
          </Checkbox>
        </CardContent>
      </Card>

      {filters.statuses.length > 0 || filters.locales.length > 0 || filters.from || filters.to ? (
        <div className="flex flex-wrap gap-2">
          {filters.from && (
            <Chip size="sm" variant="flat">
              From {filters.from}
            </Chip>
          )}
          {filters.to && (
            <Chip size="sm" variant="flat">
              To {filters.to}
            </Chip>
          )}
          {filters.statuses.map((status) => (
            <Chip key={status} size="sm" variant="flat" color="primary">
              {status}
            </Chip>
          ))}
          {filters.locales.map((locale) => (
            <Chip key={locale} size="sm" variant="flat" color="secondary">
              {locale}
            </Chip>
          ))}
        </div>
      ) : null}

      <Button color="primary" onPress={handleExport} isDisabled={isExporting}>
        {isExporting ? "导出中…" : "开始导出"}
      </Button>
    </div>
  );
}
