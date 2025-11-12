"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Particles } from "@/components/ui/particles";
import { Container } from "@/components/ui/container";
import { useTheme } from "@/hooks/use-theme";
import { MomentMasonry } from "@/components/moments/moment-masonry";
import { MomentLightbox } from "@/components/moments/moment-lightbox";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { DeleteIcon } from "@/components/moments/delete-icon";
import { MomentTabs } from "@/components/moments/moment-tabs";
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
  const pathname = usePathname();
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
      <Container width="narrow">
        <header className="mb-4 flex items-center justify-between sm:mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
            {locale === "zh" ? "瞬间" : "Moments"}
          </h1>
          <OpenComposerButton label={locale === "zh" ? "+ 新建" : "+ New"} />
        </header>

        {/* 标签页导航 */}
        <div className="mb-6">
          <MomentTabs locale={locale} currentPath={pathname} />
        </div>

        {/* 瀑布流布局 */}
        <MomentMasonry
          moments={moments.map((m) => ({
            ...m,
            isPublic: m.visibility === "PUBLIC",
            location: (m.location as { name?: string } | null)?.name ?? null,
          }))}
          locale={locale}
          isAdmin={isAdmin}
        />
      </Container>

      {/* 全屏图片预览 Lightbox */}
      <MomentLightbox />
    </div>
  );
}
