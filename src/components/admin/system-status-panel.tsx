"use client";

import { ShieldCheck, Globe, Database, Check } from "lucide-react";
import { t, type AdminLocale } from "@/lib/admin-translations";

type SystemStatusPanelProps = {
  locale: AdminLocale;
};

export function SystemStatusPanel({ locale }: SystemStatusPanelProps) {
  // Static operational status - matches Zhi approach
  // Future enhancement: Replace with real health check data from API

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <ShieldCheck size={18} />
        {t(locale, "systemStatus")}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Globe size={14} /> {t(locale, "website")}
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <Check size={12} /> {t(locale, "live")}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Database size={14} /> {t(locale, "database")}
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <Check size={12} /> {t(locale, "connected")}
          </span>
        </div>
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-emerald-500 w-full h-full rounded-full"></div>
        </div>
        <p className="text-[10px] text-stone-400 text-center mt-1">
          {t(locale, "allSystemsOperational")}
        </p>
      </div>
    </div>
  );
}
