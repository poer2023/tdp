import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
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
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Data</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t(locale, "lifeLogData")}
          </h1>
          <LuminaBadge variant="info">UI scaffold</LuminaBadge>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
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
