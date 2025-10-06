import Link from "next/link";
import { getRecentActivities } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryGrid } from "@/components/gallery-grid";
import { ScrollSyncHero } from "@/components/scroll-sync-hero";

// Incremental Static Regeneration for localized homepage
// Next.js 15 段配置需为编译期常量
export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // Fetch data for homepage
  const [gallery, activities] = await Promise.all([listGalleryImages(6), getRecentActivities(4)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-28 px-6 py-16 sm:px-8 md:px-12">
      <ScrollSyncHero activities={activities} locale={l} />

      <section className="space-y-8" id="gallery">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
              {l === "zh" ? "灵感相册" : "Photo Gallery"}
            </h2>
            <p className="text-lg leading-loose text-zinc-600 dark:text-zinc-400">
              {l === "zh"
                ? "用照片记录每一次创作的瞬间与旅程"
                : "Capturing moments and journeys through photography"}
            </p>
          </div>
          <Link
            href={`/${l}/gallery`}
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
          >
            {l === "zh" ? "查看相册" : "View gallery"}
          </Link>
        </div>

        <div className="rounded-3xl bg-zinc-100/60 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <GalleryGrid images={gallery} locale={l} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
