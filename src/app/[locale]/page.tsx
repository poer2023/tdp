import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecentActivities } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryGrid } from "@/components/gallery-grid";
import { ScrollSyncHero } from "@/components/scroll-sync-hero";
import { MomentStrip } from "@/components/moments/moment-strip";
import { localePath } from "@/lib/locale-path";

// Incremental Static Regeneration for localized homepage
// Next.js 15 段配置需为编译期常量
export const revalidate = 60;
export const dynamicParams = false; // Only allow 'en' and 'zh'

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;

  // Only allow 'en' or 'zh' as locale
  if (locale !== "en" && locale !== "zh") {
    notFound();
  }

  const l = locale === "zh" ? "zh" : "en";

  // Fetch data for homepage
  const [gallery, activities] = await Promise.all([listGalleryImages(6), getRecentActivities(10)]);
  const recentPosts = activities
    .filter(
      (activity): activity is (typeof activities)[number] & { slug: string } =>
        activity.type === "post" && Boolean(activity.slug)
    )
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-6xl space-y-28 px-6 py-16 sm:px-8 md:px-12">
        <ScrollSyncHero activities={activities} locale={l} />
        <section className="space-y-8" id="posts">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
                {l === "zh" ? "最新文章" : "Latest Posts"}
              </h2>
              <p className="text-lg leading-loose text-zinc-600 dark:text-zinc-400">
                {l === "zh"
                  ? "精选文章与长文，涵盖技术、创意与生活记录。"
                  : "Curated writing across craft, travel, and daily life."}
              </p>
            </div>
            <Link
              href={localePath(l, "/posts")}
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
            >
              {l === "zh" ? "查看全部文章" : "View all posts"}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={localePath(l, `/posts/${post.slug}`)}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <article className="space-y-3">
                    <p className="text-xs tracking-[0.3em] text-zinc-400 uppercase">
                      {l === "zh" ? "精选" : "Featured"}
                    </p>
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
                      {post.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(post.date).toLocaleDateString(l === "zh" ? "zh-CN" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </article>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {l === "zh" ? "暂无文章，敬请期待。" : "No posts published yet — check back soon!"}
              </div>
            )}
          </div>
        </section>

        <MomentStrip locale={l} />
      </div>

      <section className="w-full bg-zinc-100/60 py-14 dark:bg-zinc-900/40" id="gallery">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 sm:px-8 md:px-12">
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
              href={localePath(l, "/gallery")}
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
            >
              {l === "zh" ? "查看相册" : "View gallery"}
            </Link>
          </div>

          <GalleryGrid images={gallery} locale={l} />
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  // Generate both locales for [locale] route
  // /zh served directly, /en served via middleware rewrite (hidden from URL)
  return [{ locale: "en" }, { locale: "zh" }];
}
