import type { SiteStatistics } from "@/lib/statistics";

type ShuffleGridStatsProps = {
  statistics: SiteStatistics;
  locale: "zh" | "en";
};

type StatCardProps = {
  label: string;
  count: number;
};

function StatCard({ label, count }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="text-3xl font-semibold text-stone-900 dark:text-stone-50">{count}</div>
      <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">{label}</div>
    </div>
  );
}

export function ShuffleGridStats({ statistics, locale }: ShuffleGridStatsProps) {
  const labels = {
    title: locale === "zh" ? "留住柔软瞬间" : "Moments that stay soft",
    subtitle: locale === "zh" ? "个人笔记。简单心情。" : "Personal notes. Simple moods.",
    posts: locale === "zh" ? "文章" : "Posts",
    photos: locale === "zh" ? "照片" : "Photos",
    moments: locale === "zh" ? "动态" : "Moments",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-stone-900 sm:text-5xl md:text-6xl dark:text-stone-50">
          {labels.title}
        </h1>
        <p className="text-base text-stone-600 md:text-lg dark:text-stone-400">{labels.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label={labels.posts} count={statistics.postCount} />
        <StatCard label={labels.photos} count={statistics.photoCount} />
        <StatCard label={labels.moments} count={statistics.momentCount} />
      </div>
    </div>
  );
}
