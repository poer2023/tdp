import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryGrid } from "@/components/gallery-grid";

// Incremental Static Regeneration for localized homepage
// Next.js 15 段配置需为编译期常量
export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // Fetch all published posts regardless of locale - content doesn't switch with UI language
  const [posts, gallery] = await Promise.all([listPublishedPosts(), listGalleryImages(6)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-28 px-6 py-16 sm:px-8 md:px-12">
      <HeroSection postsCount={posts.length} locale={l} />

      <section className="space-y-8" id="posts">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {l === "zh" ? "最新文章" : "Latest Posts"}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {l === "zh"
                ? "记录我在前端、全栈与生活灵感中的发现"
                : "Discoveries in frontend, full‑stack, and life inspiration"}
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
          <div className="rounded-3xl bg-zinc-100/60 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
            <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              {posts.length > 0 && <FeaturedPost post={posts[0]!} locale={l} />}
            </div>
            {posts.length > 1 && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {posts.slice(1, 4).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
                  >
                    <CompactPost post={p} locale={l} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-8 py-16 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
            {l === "zh"
              ? "暂无公开文章，登录后台开始创作吧。"
              : "No published posts yet. Log in to the dashboard to start writing."}
          </div>
        )}
      </section>

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

function HeroSection({ postsCount, locale }: { postsCount: number; locale: "zh" | "en" }) {
  return (
    <header className="space-y-6 py-8 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          {locale === "zh" ? "清新简约的个人博客" : "Clean & Minimalist Personal Blog"}
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          {locale === "zh"
            ? "用实战经验与灵感，帮助你持续打造更好的产品与内容。"
            : "Insights and notes to help you build better products."}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="#posts"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {locale === "zh" ? "阅读文章" : "Read Posts"}
          </Link>
          <Link
            href="#gallery"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50"
          >
            {locale === "zh" ? "浏览相册" : "Browse Gallery"}
          </Link>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
            {locale === "zh" ? "共" : "Total"} {postsCount} {locale === "zh" ? "篇" : "posts"}
          </span>
        </div>
      </div>
    </header>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

function FeaturedPost({
  post,
  locale,
}: {
  post: Awaited<ReturnType<typeof listPublishedPosts>>[number];
  locale: "zh" | "en";
}) {
  const cover = post.coverImagePath ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : locale === "zh"
      ? "草稿"
      : "Draft";

  return (
    <article className="grid gap-6 p-2 sm:p-3 md:grid-cols-2 md:items-center">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={cover}
          alt={post.title}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-4 p-2 md:p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-blue-600/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-blue-700 uppercase ring-1 ring-blue-600/20 ring-inset dark:text-blue-300">
            {locale === "zh" ? "精选" : "Featured"}
          </span>
          <time className="text-xs text-zinc-500" dateTime={post.publishedAt ?? ""}>
            {formatted}
          </time>
        </div>
        <h3 className="text-2xl leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/${locale}/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {post.author?.name && <span>{post.author.name}</span>}
          <span aria-hidden>•</span>
          <span>
            {locale === "zh" ? "阅读" : "Read"}{" "}
            {Math.max(3, Math.min(20, Math.round(post.excerpt.length / 50)))}{" "}
            {locale === "zh" ? "分钟" : "min"}
          </span>
        </div>
      </div>
    </article>
  );
}

function CompactPost({
  post,
  locale,
}: {
  post: Awaited<ReturnType<typeof listPublishedPosts>>[number];
  locale: "zh" | "en";
}) {
  const cover = post.coverImagePath ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : locale === "zh"
      ? "草稿"
      : "Draft";

  return (
    <article className="grid grid-cols-[56px_1fr] items-center gap-3 p-1">
      <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
        <Image src={cover} alt={post.title} fill sizes="56px" className="object-cover" />
      </div>
      <div className="space-y-1.5">
        <h4 className="line-clamp-2 text-sm leading-tight font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/${locale}/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <time dateTime={post.publishedAt ?? ""}>{formatted}</time>
          {post.tags.length > 0 && <span aria-hidden>•</span>}
          {post.tags.length > 0 && <span className="truncate">#{post.tags[0]}</span>}
        </div>
      </div>
    </article>
  );
}
