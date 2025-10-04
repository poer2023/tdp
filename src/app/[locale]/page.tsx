import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { PostCard } from "@/components/post-card";
import { GalleryGrid } from "@/components/gallery-grid";

export const revalidate = 0;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // Fetch all published posts regardless of locale - content doesn't switch with UI language
  const [posts, gallery] = await Promise.all([listPublishedPosts(), listGalleryImages(6)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-32 px-6 py-20 sm:px-8 md:px-12">
      <HeroSection postsCount={posts.length} locale={l} />

      <section className="space-y-12" id="posts">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
              {l === "zh" ? "最新文章" : "Latest Posts"}
            </h2>
            <p className="text-lg leading-loose text-zinc-600 dark:text-zinc-400">
              {l === "zh"
                ? "记录我在前端、全栈与生活灵感中的发现"
                : "Discoveries in frontend, full-stack, and life inspiration"}
            </p>
          </div>
          <Link
            href={`/${l}/posts`}
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
          >
            {l === "zh" ? "查看全部文章" : "View all posts"}
          </Link>
        </div>

        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} locale={l} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-8 py-16 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
            {l === "zh"
              ? "暂无公开文章，登录后台开始创作吧。"
              : "No published posts yet. Log in to the dashboard to start writing."}
          </div>
        )}
      </section>

      <section className="space-y-12" id="gallery">
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

        <GalleryGrid images={gallery} locale={l} />
      </section>
    </div>
  );
}

function HeroSection({ postsCount, locale }: { postsCount: number; locale: "zh" | "en" }) {
  return (
    <header className="space-y-8 py-12 md:py-20">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="text-5xl leading-tight font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          {locale === "zh" ? "清新简约的个人博客" : "Clean & Minimalist Personal Blog"}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-loose text-zinc-600 dark:text-zinc-400">
          {locale === "zh"
            ? "采用最新 Next.js 15 + React 19 技术栈，支持 Markdown 写作、相册照片以及后台管理"
            : "Built with Next.js 15 + React 19, supporting Markdown writing, photo gallery, and admin dashboard"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="#posts"
            className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {locale === "zh" ? "阅读文章" : "Read Posts"}
          </Link>
          <Link
            href="#gallery"
            className="rounded-md border-2 border-zinc-900 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-50"
          >
            {locale === "zh" ? "浏览相册" : "Browse Gallery"}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
