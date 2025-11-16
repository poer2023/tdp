"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { BottomTabBar } from "@/components/admin/bottom-tab-bar";
import type { AdminLocale } from "@/lib/admin-translations";
import { Button, Surface } from "@/components/ui-heroui";

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
      <Button
        aria-label="Open navigation"
        variant="secondary"
        size="sm"
        className="fixed top-[72px] left-4 z-40 md:hidden"
        onPress={() => setMobileOpen(true)}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </Button>

      {/* Main content */}
      <div className="h-full md:ml-64">
        <div className="h-full overflow-hidden p-[5px]">
          <Surface
            variant="flat"
            className="h-full rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="admin-scroll h-full overflow-y-auto overscroll-contain px-4 py-4 pb-20 sm:px-6 sm:py-6 md:px-8 md:py-8 md:pb-8">
              <div className="mx-auto max-w-[1200px]">{children}</div>
            </div>
          </Surface>
        </div>
      </div>

      {/* Bottom Tab Bar - Mobile only (<768px) */}
      <BottomTabBar locale={locale} />
    </div>
  );
}
