import type { Metadata } from "next";
import { ZhiHeader, ZhiFooter, ZhiProjects } from "@/components/zhi";
import type { ZhiProject } from "@/components/zhi";
import { aboutContent, resolveAboutLocale } from "@/lib/about-content";
import LandingPage from "@/components/intimome/LandingPage";

// Revalidate every 60 seconds
export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const l = resolveAboutLocale(locale);

  return {
    title: l === "zh" ? "项目作品 + IntimDiary" : "Projects + IntimDiary",
    description:
      l === "zh"
        ? "我的项目作品集，以及 IntimDiary 产品展示。"
        : "My project showcase, featuring IntimDiary.",
  };
}

// Convert about-content projects to Zhi project format
function toProjectItem(
  project: { period: string; title: string; description: string; image: string; stack: string[] },
  index: number,
  locale: string
): ZhiProject {
  const year = project.period.split("·")[0]?.trim() || "2024";
  return {
    id: `project-${index}`,
    year: year,
    role: locale === "zh" ? "个人项目" : "Personal Project",
    title: project.title,
    description: project.description,
    technologies: project.stack,
    imageUrl: project.image,
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

  // 1. Create the IntimDiary Slide Project Item
  const intimDiaryProject: ZhiProject = {
    id: "intimome-landing", // Unique ID
    year: "2024",
    role: "Product",
    title: "IntimDiary",
    description: "AI-Powered Diary",
    technologies: [],
    imageUrl: "", // Not used because component is present
    component: <LandingPage locale={locale} />,
  };

  // 2. Get existing projects
  const standardProjects: ZhiProject[] = data.projects.map((p, i) => toProjectItem(p, i, locale));

  // 3. Combine them: IntimDiary first
  const mixedProjects: ZhiProject[] = [intimDiaryProject, ...standardProjects];

  return (
    <>
      <ZhiHeader />
      <main className="bg-stone-50 dark:bg-stone-950">
        <ZhiProjects projects={mixedProjects} />
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
