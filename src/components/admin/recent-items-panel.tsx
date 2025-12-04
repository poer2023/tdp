"use client";

import { formatDistanceToNow, isValid } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Clock, FileText, Image, Camera } from "lucide-react";
import { t, type AdminLocale } from "@/lib/admin-translations";
import type { Post, GalleryImage } from "@prisma/client";

type RecentItem = {
  id: string;
  title: string;
  type: "post" | "gallery" | "moment";
  date: Date;
  icon: typeof FileText | typeof Image | typeof Camera;
};

type RecentItemsPanelProps = {
  recentPosts: (Post & { author: { name: string | null } | null })[];
  recentUploads: GalleryImage[];
  locale: AdminLocale;
};

// Helper to safely parse date
function safeDate(value: Date | string | number | null | undefined): Date {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : new Date();
}

export function RecentItemsPanel({ recentPosts, recentUploads, locale }: RecentItemsPanelProps) {
  // Aggregate and sort recent activity (matches Lumina pattern)
  const recentActivity: RecentItem[] = [
    ...recentPosts.slice(0, 2).map(post => ({
      id: post.id,
      title: post.title,
      type: "post" as const,
      date: safeDate(post.updatedAt),
      icon: FileText,
    })),
    ...recentUploads.slice(0, 2).map(upload => ({
      id: upload.id,
      title: upload.title || "Untitled",
      type: "gallery" as const,
      date: safeDate(upload.createdAt),
      icon: Camera,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4);

  const typeLabel = (type: RecentItem["type"]) => {
    switch (type) {
      case "post": return t(locale, "post");
      case "gallery": return t(locale, "photo");
      case "moment": return t(locale, "moment");
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Clock size={18} />
        {t(locale, "recentItems")}
      </h3>
      <div className="space-y-4">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t(locale, "noRecentActivity")}
          </p>
        ) : (
          recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0"
            >
              <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded text-stone-500">
                <item.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                  {item.title}
                </div>
                <div className="text-xs text-stone-400">
                  {typeLabel(item.type)} • {formatDistanceToNow(item.date, {
                    addSuffix: true,
                    locale: locale === "zh" ? zhCN : undefined,
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
