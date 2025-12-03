import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { MomentForm } from "@/components/admin/moment-form";

export const revalidate = 0;

export default async function NewMomentPage() {
  const locale = await getAdminLocale();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Moments</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "moments")} · New
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">快速创建一条新的瞬间记录。</p>
      </header>

      <MomentForm submitLabel="创建" />
    </div>
  );
}
