"use client";

import { useMemo } from "react";
import { Particles } from "@/components/ui/particles";
import { useTheme } from "@/hooks/use-theme";
import { MomentCard } from "@/components/moments/moment-card";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { DeleteIcon } from "@/components/moments/delete-icon";
import type { MomentListItem } from "@/lib/moments";

interface ParticlesMomentsContentProps {
  moments: MomentListItem[];
  locale: "en" | "zh";
  isAdmin: boolean;
}

export function ParticlesMomentsContent({
  moments,
  locale,
  isAdmin,
}: ParticlesMomentsContentProps) {
  const { theme } = useTheme();
  const particleColor = useMemo(() => (theme === "dark" ? "#ffffff" : "#000000"), [theme]);

  return (
    <div className="relative min-h-screen">
      {/* Particles 背景层 */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={150}
        ease={80}
        color={particleColor}
        staticity={50}
        size={0.4}
      />

      {/* 原有内容 */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-4 flex items-center justify-between sm:mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
            {locale === "zh" ? "瞬间" : "Moments"}
          </h1>
          <OpenComposerButton label={locale === "zh" ? "+ 新建" : "+ New"} />
        </header>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {moments.map((m) => (
            <div key={m.id} className="relative space-y-2">
              <MomentCard
                id={m.id}
                slug={m.slug}
                content={m.content}
                images={m.images}
                createdAt={m.createdAt}
                visibility={m.visibility}
                tags={m.tags}
                locationName={(m.location as { name?: string } | null)?.name ?? null}
                locale={locale}
              />
              {isAdmin && <DeleteIcon id={m.id} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
