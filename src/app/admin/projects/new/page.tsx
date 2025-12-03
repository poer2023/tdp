import { getAdminLocale, t } from "@/lib/admin-i18n";
import { ProjectForm } from "@/components/admin/project-form";

export const revalidate = 0;

export default async function NewProjectPage() {
  const locale = await getAdminLocale();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Projects</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "projects")} · New
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">创建一个新的项目条目。</p>
      </header>

      <ProjectForm submitLabel="创建" />
    </div>
  );
}
