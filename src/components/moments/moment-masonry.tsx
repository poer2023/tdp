"use client";

import React from "react";
import type { MomentListItem } from "@/lib/moments";
import { MomentMasonryCard } from "./moment-masonry-card";

type MomentWithMasonryData = MomentListItem & {
  isPublic: boolean;
  location: string | null;
};

interface MomentMasonryProps {
  moments: MomentWithMasonryData[];
  locale: "zh" | "en";
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function MomentMasonry({
  moments,
  locale,
  onDelete,
  isAdmin = false,
}: MomentMasonryProps) {
  if (!moments || moments.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-500 dark:text-zinc-400">
        <p className="text-lg">
          {locale === "zh" ? "暂无动态" : "No moments yet"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="masonry-container"
      style={
        {
          "--columns-mobile": "1",  // <640px
          "--columns-sm": "2",       // 640-768px
          "--columns-md": "3",       // 768-1024px
          "--columns-lg": "4",       // ≥1024px
          "--gap": "1rem",           // 16px
        } as React.CSSProperties
      }
    >
      <style jsx>{`
        .masonry-container {
          column-count: var(--columns-mobile);
          column-gap: var(--gap);
        }

        /* 小平板：2列 */
        @media (min-width: 640px) {
          .masonry-container {
            column-count: var(--columns-sm);
          }
        }

        /* 大平板：3列 */
        @media (min-width: 768px) {
          .masonry-container {
            column-count: var(--columns-md);
          }
        }

        /* 桌面端：固定4列 */
        @media (min-width: 1024px) {
          .masonry-container {
            column-count: var(--columns-lg);
          }
        }

        .masonry-container > * {
          break-inside: avoid;
          margin-bottom: var(--gap);
        }
      `}</style>

      {moments.map((moment) => (
        <div key={moment.id} className="masonry-item">
          <MomentMasonryCard
            moment={moment}
            locale={locale}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
        </div>
      ))}
    </div>
  );
}
