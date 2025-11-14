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
      className="h-10 whitespace-nowrap rounded-full bg-[#0F172A] px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#111A2C] active:scale-[0.98] active:bg-[#0B1120] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] dark:focus-visible:outline-[#93C5FD]"
      onClick={open}
      type="button"
    >
      {label}
    </button>
  );
}
