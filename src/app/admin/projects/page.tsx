import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { LuminaBadge, LuminaEmptyState, LuminaRichPostItem } from "@/components/admin/lumina-shared";
import { ProjectForm } from "@/components/admin/project-form";

export const revalidate = 0;

export default async function ProjectsPage() {
  const locale = await getAdminLocale();
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Portfolio</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          {t(locale, "projects")}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          完整的项目卡片布局，后续接入 Prisma 模型与 Server Action。
        </p>
      </header>

      <ProjectForm submitLabel="保存项目" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            所有项目
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">共 {projects.length} 个</span>
        </div>
        {projects.length === 0 ? (
          <LuminaEmptyState title="暂无项目" description="添加第一条项目以填充列表。" />
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <LuminaRichPostItem
                key={project.id}
                title={project.title}
                excerpt={project.description}
                coverUrl={project.imageUrl ?? undefined}
                tags={project.technologies}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
