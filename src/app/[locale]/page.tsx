import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts, getRecentActivities } from "@/lib/posts";
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
  const [posts, gallery, activities] = await Promise.all([
    listPublishedPosts(),
    listGalleryImages(6),
    getRecentActivities(4),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-28 px-6 py-16 sm:px-8 md:px-12">
      <IntroSection activities={activities} locale={l} />

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

function IntroSection({
  activities,
  locale,
}: {
  activities: Awaited<ReturnType<typeof getRecentActivities>>;
  locale: "zh" | "en";
}) {
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return locale === "zh" ? "刚刚" : "just now";
    if (diffInSeconds < 3600)
      return locale === "zh"
        ? `${Math.floor(diffInSeconds / 60)} 分钟前`
        : `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return locale === "zh"
        ? `${Math.floor(diffInSeconds / 3600)} 小时前`
        : `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return locale === "zh"
        ? `${Math.floor(diffInSeconds / 86400)} 天前`
        : `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000)
      return locale === "zh"
        ? `${Math.floor(diffInSeconds / 604800)} 周前`
        : `${Math.floor(diffInSeconds / 604800)}w ago`;

    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <section className="rounded-3xl bg-zinc-100/60 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
      <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 md:p-12 dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 ring-4 ring-zinc-100 dark:from-zinc-700 dark:to-zinc-800 dark:ring-zinc-900">
            <div className="flex h-full items-center justify-center text-5xl text-zinc-600 dark:text-zinc-400">
              👤
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {locale === "zh" ? "张三" : "Your Name"}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {locale === "zh" ? "前端工程师 & 摄影爱好者" : "Frontend Engineer & Photographer"}
            </p>
          </div>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {locale === "zh"
              ? "专注于 Web 性能优化与用户体验设计，用代码和镜头记录生活与思考。"
              : "Focused on Web performance optimization and UX design, documenting life and thoughts through code and lens."}
          </p>

          <div className="flex items-center justify-center gap-6 text-sm">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span>⚡</span>
              <span>GitHub</span>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span>🐦</span>
              <span>Twitter</span>
            </a>
            <a
              href="mailto:hello@example.com"
              className="flex items-center gap-1.5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span>✉️</span>
              <span>Email</span>
            </a>
          </div>
        </div>

        {activities.length > 0 && (
          <div className="mx-auto mt-12 max-w-2xl">
            <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {locale === "zh" ? "最近更新" : "Recent Activity"}
            </h2>
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={
                    activity.type === "post"
                      ? `/${locale}/posts/${activity.slug}`
                      : `/${locale}/gallery#${activity.id}`
                  }
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">{activity.type === "post" ? "📝" : "📸"}</span>
                  <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {activity.title}
                  </span>
                  <time className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatRelativeTime(activity.date)}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
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
