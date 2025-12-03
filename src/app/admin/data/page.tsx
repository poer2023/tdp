import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { LuminaBadge } from "@/components/admin/lumina-shared";
import { DataSections } from "@/components/admin/data-section";

export const revalidate = 0;

export default async function LifeLogDataPage() {
  const locale = await getAdminLocale();
  const [skills, routines, steps, photos] = await Promise.all([
    prisma.skillData.findMany(),
    prisma.routineData.findMany(),
    prisma.stepsData.findMany({ orderBy: { date: "asc" } }),
    prisma.photoStats.findMany({ orderBy: { date: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Quantified Self</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          {t(locale, "lifeLogData")}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          量化自我数据的前端布局已完成，等待与同步数据源对接。
        </p>
      </header>

      <DataSections
        initialSkills={skills}
        initialRoutine={routines.map((item) => ({
          name: item.name,
          hours: item.value,
          color: item.color,
        }))}
        initialSteps={steps.map((item) => ({
          label: new Date(item.date).toLocaleDateString("zh-CN", { weekday: "short" }),
          value: item.steps,
        }))}
        initialPhotos={photos.map((item) => ({
          label: new Date(item.date).toLocaleDateString("zh-CN", { weekday: "short" }),
          value: item.count,
        }))}
      />
    </div>
  );
}
