import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { LuminaBadge } from "@/components/admin/lumina-shared";
import { HeroImageManager } from "@/components/admin/hero-image-manager";

export const revalidate = 0;

export default async function HeroImagesPage() {
  const locale = await getAdminLocale();
  const items = await prisma.heroImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Media</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          {t(locale, "heroImages")}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">管理首页头图，支持启用、删除与排序。</p>
      </header>

      <HeroImageManager initialItems={items} />
    </div>
  );
}
