import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { LuminaBadge } from "@/components/admin/lumina-shared";
import { MomentForm } from "@/components/admin/moment-form";
import { MomentList } from "@/components/admin/moment-list";

export const revalidate = 0;

export default async function MomentsPage() {
  const locale = await getAdminLocale();
  const moments = await prisma.moment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Content</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          {t(locale, "moments")}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          碎片动态、标签、可见性与多图上传，复用 Lumina 的卡片与输入样式。
        </p>
      </header>

      <MomentForm submitLabel="保存草稿" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            最近动态
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">共 {moments.length} 条</span>
        </div>
        <MomentList
          items={moments.map((item) => ({
            id: item.id,
            content: item.content,
            tags: item.tags,
            visibility: item.visibility,
            location:
              typeof item.location === "object" && item.location !== null
                ? (item.location as any)?.name ?? undefined
                : undefined,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
