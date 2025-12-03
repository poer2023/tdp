import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { LuminaBadge, LuminaEmptyState, LuminaRichPostItem } from "@/components/admin/lumina-shared";
import { ProjectForm } from "@/components/admin/project-form";

export const revalidate = 0;

export default async function ProjectsPage() {
  const locale = await getAdminLocale();
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Projects</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t(locale, "projects")}
          </h1>
          <LuminaBadge variant="info">UI scaffold</LuminaBadge>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          完整的项目卡片布局，后续接入 Prisma 模型与 Server Action。
        </p>
      </header>

      <ProjectForm submitLabel="保存项目" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            预览卡片
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">示例数据</span>
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
