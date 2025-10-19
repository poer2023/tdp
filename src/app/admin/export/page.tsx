import dynamic from "next/dynamic";
import { features } from "@/config/features";
import { ModuleLoadingSkeleton } from "@/components/error-boundaries/module-error-fallback";

const ExportClient = dynamic(
  () => import("./export-client").then((mod) => ({ default: mod.ExportClient })),
  {
    ssr: false,
    loading: () => <ModuleLoadingSkeleton rows={4} />,
  }
);

export default function AdminExportPage() {
  if (!features.get("adminExport")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Operations</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            内容导出
          </h1>
        </header>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          内容导出功能已禁用。请将
          <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">
            FEATURE_ADMIN_EXPORT
          </code>
          设置为 on 并重新部署。
        </section>
      </div>
    );
  }

  return <ExportClient />;
}
