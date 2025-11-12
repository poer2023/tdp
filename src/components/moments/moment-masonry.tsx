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
          "--columns-mobile": "1",
          "--columns-sm": "2",
          "--columns-lg": "3",
          "--columns-xl": "4",
          "--gap": "1rem",
        } as React.CSSProperties
      }
    >
      <style jsx>{`
        .masonry-container {
          column-count: var(--columns-mobile);
          column-gap: var(--gap);
        }

        @media (min-width: 640px) {
          .masonry-container {
            column-count: var(--columns-sm);
          }
        }

        @media (min-width: 1024px) {
          .masonry-container {
            column-count: var(--columns-lg);
          }
        }

        @media (min-width: 1280px) {
          .masonry-container {
            column-count: var(--columns-xl);
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
