import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { LuminaBadge, LuminaListContainer, LuminaListItem } from "@/components/admin/lumina-shared";
import { ShareItemForm } from "@/components/admin/share-item-form";

export const revalidate = 0;

export default async function CuratedPage() {
  const locale = await getAdminLocale();
  const items = await prisma.shareItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Content</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          {t(locale, "curated")}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          精选链接录入表单已对齐 Lumina，后续接入域名提取与数据库保存。
        </p>
      </header>

      <ShareItemForm submitLabel="保存精选" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            精选列表
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">共 {items.length} 条</span>
        </div>
        <LuminaListContainer>
          {items.map((item) => (
            <LuminaListItem
              key={item.id}
              title={item.title}
              subtitle={item.description}
              badge={<LuminaBadge>{item.domain}</LuminaBadge>}
              actions={<LuminaBadge variant="info">待同步</LuminaBadge>}
            >
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800">
                    #{tag}
                  </span>
                ))}
              </div>
            </LuminaListItem>
          ))}
        </LuminaListContainer>
      </section>
    </div>
  );
}
