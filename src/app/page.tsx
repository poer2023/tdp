import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { GalleryGrid } from "@/components/gallery-grid";

// Incremental Static Regeneration for homepage
// 注意：Next.js 15 要求段配置为静态常量，禁止调用表达式
export const revalidate = 60;

export default async function Home() {
  const [posts, gallery] = await Promise.all([listPublishedPosts(), listGalleryImages(6)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-28 px-6 py-16 sm:px-8 md:px-12">
      <HeroSection postsCount={posts.length} />

      <section className="space-y-8" id="posts">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              最新文章
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">记录我在前端、全栈与生活灵感中的发现</p>
          </div>
          <Link
            href="/posts"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
          >
            查看全部文章
          </Link>
        </div>

        {posts.length ? (
          <div className="rounded-3xl bg-zinc-100/60 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
            {/* Featured */}
            <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              {posts.length > 0 && <FeaturedPost post={posts[0]!} />}
            </div>

            {/* Sub posts */}
            {posts.length > 1 && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {posts.slice(1, 4).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
                  >
                    <CompactPost post={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-8 py-16 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
            暂无公开文章，登录后台开始创作吧。
          </div>
        )}
      </section>

      <section className="space-y-8" id="gallery">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">灵感相册</h2>
            <p className="text-lg leading-loose text-zinc-600 dark:text-zinc-400">
              用照片记录每一次创作的瞬间与旅程
            </p>
          </div>
          <Link
            href="/gallery"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
          >
            查看相册
          </Link>
        </div>

        <div className="rounded-3xl bg-zinc-100/60 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <GalleryGrid images={gallery} />
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroSection({ postsCount }: { postsCount: number }) {
  return (
    <header className="space-y-6 py-8 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          The Marketing Menu
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Grow your product and increase reach with insights from building and running this blog.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="#posts"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            阅读文章
          </Link>
          <Link
            href="#gallery"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50"
          >
            浏览相册
          </Link>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">共 {postsCount} 篇</span>
        </div>
      </div>
    </header>
  );
}

function FeaturedPost({ post }: { post: Awaited<ReturnType<typeof listPublishedPosts>>[number] }) {
  const cover = post.coverImagePath ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(post.publishedAt)
      )
    : "草稿";

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
            精选
          </span>
          <time className="text-xs text-zinc-500" dateTime={post.publishedAt ?? ""}>
            {formatted}
          </time>
        </div>
        <h3 className="text-2xl leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/zh/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {post.author?.name && <span>{post.author.name}</span>}
          <span aria-hidden>•</span>
          <span>阅读 {Math.max(3, Math.min(20, Math.round(post.excerpt.length / 50)))} 分钟</span>
        </div>
      </div>
    </article>
  );
}

function CompactPost({ post }: { post: Awaited<ReturnType<typeof listPublishedPosts>>[number] }) {
  const cover = post.coverImagePath ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(post.publishedAt)
      )
    : "草稿";

  return (
    <article className="grid grid-cols-[56px_1fr] items-center gap-3 p-1">
      <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
        <Image src={cover} alt={post.title} fill sizes="56px" className="object-cover" />
      </div>
      <div className="space-y-1.5">
        <h4 className="line-clamp-2 text-sm leading-tight font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/zh/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
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
