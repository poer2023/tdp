import { getAdminLocale, t } from "@/lib/admin-i18n";
import { ShareItemForm } from "@/components/admin/share-item-form";

export const revalidate = 0;

export default async function NewCuratedPage() {
  const locale = await getAdminLocale();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Curated</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "curated")} · New
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">创建一条新的精选记录。</p>
      </header>

      <ShareItemForm submitLabel="创建" />
    </div>
  );
}
