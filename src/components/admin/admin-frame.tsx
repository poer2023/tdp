"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import type { AdminLocale } from "@/lib/admin-translations";

type AdminFrameProps = {
  locale: AdminLocale;
  children: React.ReactNode;
};

export function AdminFrame({ locale, children }: AdminFrameProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route changes via hash/popstate
  useEffect(() => {
    const handler = () => setMobileOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed top-16 right-0 bottom-0 left-0 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Sidebar */}
      <AdminNav locale={locale} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 top-16 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Open button (mobile) */}
      <button
        type="button"
        aria-label="Open navigation"
        className="fixed top-[72px] left-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300"
        onClick={() => setMobileOpen(true)}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Main content */}
      <div className="h-full md:ml-64">
        {/* Fixed Gray Card Background - Full Height, 5px edge gap to viewport */}
        <div className="h-full overflow-hidden p-[5px]">
          <div className="h-full rounded-2xl bg-zinc-50 shadow-sm dark:bg-zinc-900">
            {/* Scrolling Content Container Inside Card */}
            <div className="admin-scroll h-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
              <div className="mx-auto max-w-[1200px]">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
