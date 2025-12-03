import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { ProjectForm } from "@/components/admin/project-form";

export const revalidate = 0;

type EditPageProps = {
  params: { id: string };
};

export default async function EditProjectPage({ params }: EditPageProps) {
  const locale = await getAdminLocale();
  const project = await prisma.project.findUnique({ where: { id: params.id } });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Projects</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "projects")}: {params.id}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">编辑项目信息，后续接入数据库数据。</p>
      </header>

      {project ? (
        <ProjectForm
          projectId={project.id}
          submitLabel="更新"
          defaultValues={{
            title: project.title,
            description: project.description,
            cover: project.imageUrl ?? "",
            role: project.role ?? "",
            year: project.year ?? "",
            demoUrl: project.demoUrl ?? "",
            repoUrl: project.repoUrl ?? "",
            technologies: project.technologies.join(","),
            features: project.features.join(","),
            statsJson: project.stats ? JSON.stringify(project.stats) : "",
          }}
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          未找到该项目。
        </div>
      )}
    </div>
  );
}
