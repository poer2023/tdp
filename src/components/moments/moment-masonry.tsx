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

  // Floating row logic: last 2 cards get special styling when total >= 8
  const hasFloatingRow = moments.length >= 8;
  const mainMoments = hasFloatingRow ? moments.slice(0, -2) : moments;
  const floatingMoments = hasFloatingRow ? moments.slice(-2) : [];

  return (
    <div className="pb-16 pt-8">
      {/* Main masonry grid */}
      <div className="columns-2 gap-3 sm:columns-3 sm:gap-[18px] lg:columns-5 lg:gap-6">
        {mainMoments.map((moment) => (
          <div key={moment.id} className="mb-4 break-inside-avoid lg:mb-7">
            <MomentMasonryCard
              moment={moment}
              locale={locale}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          </div>
        ))}
      </div>

      {/* Floating row (last 2 cards with responsive offset) */}
      {hasFloatingRow && floatingMoments.length === 2 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-[18px] lg:mt-0 lg:grid-cols-5 lg:gap-6">
          {/* Second-to-last card: responsive offset */}
          <div className="break-inside-avoid md:translate-y-6 lg:-translate-x-12 lg:translate-y-10">
            <MomentMasonryCard
              moment={floatingMoments[0]!}
              locale={locale}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          </div>

          {/* Last card: responsive offset */}
          <div className="break-inside-avoid md:translate-y-6 lg:translate-x-12 lg:translate-y-10">
            <MomentMasonryCard
              moment={floatingMoments[1]!}
              locale={locale}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </div>
  );
}
