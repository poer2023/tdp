import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { LuminaBadge, LuminaListContainer, LuminaListItem } from "@/components/admin/lumina-shared";
import { ShareItemForm } from "@/components/admin/share-item-form";

export const revalidate = 0;

export default async function CuratedPage() {
  const locale = await getAdminLocale();
  const items = await prisma.shareItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Curated</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t(locale, "curated")}
          </h1>
          <LuminaBadge variant="info">UI scaffold</LuminaBadge>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          精选链接录入表单已对齐 Lumina，后续接入域名提取与数据库保存。
        </p>
      </header>

      <ShareItemForm submitLabel="保存精选" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            预览列表
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">示例数据</span>
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
