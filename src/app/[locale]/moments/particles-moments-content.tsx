"use client";

import { useMemo, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

  // Client-side admin check via API
  const [isAdmin, setIsAdmin] = useState(serverIsAdmin);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (serverIsAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- trust server for admin
      setChecked(true);
      return;
    }
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user?.role === "ADMIN") {
           
          setIsAdmin(true);
        }
      })
      .catch(() => { })
      .finally(() => {
         
        setChecked(true);
      });
  }, [serverIsAdmin]);

  // Show admin controls container but hide content until session loads
  const adminButtonVisible = checked && isAdmin;

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
        <div className="mx-auto w-full px-4 pt-6 pb-20 sm:px-8 md:px-12 lg:px-16 lg:pt-8 xl:max-w-[1240px]">
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

