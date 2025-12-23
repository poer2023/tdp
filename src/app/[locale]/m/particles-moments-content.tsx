"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Particles } from "@/components/ui/particles";
import { useTheme } from "@/hooks/use-theme";
import { MomentMasonry } from "@/components/moments/moment-masonry";
import { MomentLightbox } from "@/components/moments/moment-lightbox";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { MomentTabs } from "@/components/moments/moment-tabs";
import { LightboxProvider } from "@/contexts/lightbox-context";
import type { MomentListItem } from "@/lib/moments";

interface ParticlesMomentsContentProps {
  moments: MomentListItem[];
  locale: "en" | "zh";
  isAdmin: boolean; // Initial value from server (always false for ISR)
}

export function ParticlesMomentsContent({
  moments,
  locale,
  isAdmin: serverIsAdmin,
}: ParticlesMomentsContentProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const particleColor = useMemo(() => (theme === "dark" ? "#ffffff" : "#000000"), [theme]);

  // Client-side admin check (hydrates after initial render)
  const { data: session, status } = useSession();
  const isAdmin = useMemo(() => {
    if (serverIsAdmin) return true; // Trust server if it says admin
    if (status === "loading") return false; // Not yet loaded
    return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  }, [serverIsAdmin, session, status]);

  // Show admin controls container but hide content until session loads
  // This preserves layout space and prevents content shift
  const adminButtonVisible = status !== "loading" && isAdmin;

  return (
    <LightboxProvider>
      <div className="relative min-h-screen bg-[#F5F7FB] dark:bg-[#0B1220]">
        {/* Particles 背景层 */}
        <Particles
          className="absolute inset-0 -z-10"
          quantity={150}
          ease={80}
          color={particleColor}
          staticity={50}
          size={0.4}
        />

        {/* 半透明遮罩层 */}
        <div className="absolute inset-0 -z-10 bg-[#F5F7FB]/60 dark:bg-[#0B1220]/60" />

        {/* 内容主体容器 */}
        <div className="mx-auto w-full px-4 py-20 sm:px-8 md:px-12 lg:px-16 lg:py-[120px] xl:max-w-[1240px]">
          {/* Hero 模块 */}
          <div className="mb-8 flex flex-col items-center lg:mb-12">
            <h1 className="mb-2 text-center text-[32px] font-semibold leading-[38px] tracking-tight text-[#0F172A] sm:text-[42px] sm:leading-[50px] dark:text-[#F8FAFC]">
              {locale === "zh" ? "纯净图集 - 瀑布流布局" : "Pure Image Gallery – Waterfall Layouts"}
            </h1>
            <p className="max-w-[720px] text-center text-lg leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
              {locale === "zh" ? "专为瀑布流布局而设" : "Designed for Waterfall Layouts"}
            </p>
          </div>

          {/* 工具栏（Tabs + 按钮组合）*/}
          <div className="mb-8 flex flex-col items-center gap-3 rounded-full bg-white px-6 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:flex-row sm:justify-between dark:bg-[#111827] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <MomentTabs locale={locale} currentPath={pathname} />
            {/* Admin button: reserve space with visibility:hidden when loading, show when ready */}
            <div style={{ visibility: adminButtonVisible ? "visible" : "hidden" }}>
              <OpenComposerButton label={locale === "zh" ? "+ 新建" : "+ New"} />
            </div>
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
        </div>

        {/* 全屏图片预览 Lightbox */}
        <MomentLightbox />
      </div>
    </LightboxProvider>
  );
}

