"use client";

import dynamic from "next/dynamic";
import { ModuleLoadingSkeleton } from "@/components/error-boundaries/module-error-fallback";

const ExportClientLazy = dynamic(
  () => import("./export-client").then((mod) => ({ default: mod.ExportClient })),
  {
    ssr: false,
    loading: () => <ModuleLoadingSkeleton rows={4} />,
  }
);

export function ExportClientShell() {
  return <ExportClientLazy />;
}
