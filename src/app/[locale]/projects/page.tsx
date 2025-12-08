import type { Metadata } from "next";
import { ZhiHeader, ZhiFooter, ZhiProjects } from "@/components/lumina";
import type { ZhiProject } from "@/components/lumina";
import { aboutContent, resolveAboutLocale } from "@/lib/about-content";

// Revalidate every 60 seconds
export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const l = resolveAboutLocale(locale);

  return {
    title: l === "zh" ? "项目作品" : "Projects",
    description:
      l === "zh"
        ? "我的代码玩具、实验工具和项目作品集。"
        : "My playground of code toys, experimental tools, and project showcase.",
  };
}

// Convert about-content projects to Zhi project format
function toProjectItem(
  project: { period: string; title: string; description: string; image: string; stack: string[] },
  index: number,
  locale: string
): ZhiProject {
  // Extract year from period (e.g., "2024 · Hikari Loom" -> "2024")
  const year = project.period.split("·")[0]?.trim() || "2024";
  return {
    id: `project-${index}`,
    year: year,
    role: locale === "zh" ? "个人项目" : "Personal Project",
    title: project.title,
    description: project.description,
    technologies: project.stack,
    imageUrl: project.image,
    // Add some default features based on stack
    features:
      project.stack.length > 2
        ? [
          locale === "zh" ? "现代技术栈" : "Modern Tech Stack",
          locale === "zh" ? "响应式设计" : "Responsive Design",
        ]
        : undefined,
  };
}

export default async function LocalizedProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  const l = resolveAboutLocale(locale);
  const data = aboutContent[l];

  // Convert about page projects to Zhi format
  const projects: ZhiProject[] = data.projects.map((p, i) => toProjectItem(p, i, l));

  return (
    <>
      <ZhiHeader />
      <main className="bg-stone-50 dark:bg-stone-950">
        <ZhiProjects projects={projects} />
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
