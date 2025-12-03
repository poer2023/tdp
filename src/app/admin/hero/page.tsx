import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { LuminaBadge } from "@/components/admin/lumina-shared";
import { HeroImageManager } from "@/components/admin/hero-image-manager";

export const revalidate = 0;

export default async function HeroImagesPage() {
  const locale = await getAdminLocale();
  const items = await prisma.heroImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Hero</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t(locale, "heroImages")}
          </h1>
          <LuminaBadge variant="info">排序拖拽待接入</LuminaBadge>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">管理首页头图，支持启用、删除与排序。</p>
      </header>

      <HeroImageManager initialItems={items} />
    </div>
  );
}
