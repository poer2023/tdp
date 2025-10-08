"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function OpenComposerButton({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function open() {
    try {
      window.dispatchEvent(new CustomEvent("open-moment-composer"));
    } catch {}
    // push ?compose=1 以便在一些环境下通过 URL 触发弹窗
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set("compose", "1");
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <button
      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      onClick={open}
      type="button"
    >
      {label}
    </button>
  );
}
