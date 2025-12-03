import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
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
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Moments</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t(locale, "moments")}
          </h1>
          <LuminaBadge variant="info">UI 已对齐 Lumina，等待接入数据</LuminaBadge>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          碎片动态、标签、可见性与多图上传，复用 Lumina 的卡片与输入样式。
        </p>
      </header>

      <MomentForm submitLabel="保存草稿" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            预览列表
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">示例数据，后续接入 Prisma</span>
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
