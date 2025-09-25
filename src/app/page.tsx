import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { PostCard } from "@/components/post-card";
import { GalleryGrid } from "@/components/gallery-grid";

export const revalidate = 0;

export default async function Home() {
  const [posts, gallery] = await Promise.all([listPublishedPosts(), listGalleryImages(6)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-12 sm:px-8 md:px-12">
      <HeroSection postsCount={posts.length} />

      <section className="space-y-8" id="posts">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">最新文章</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              记录我在前端、全栈与生活灵感中的发现。
            </p>
          </div>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            查看全部文章 →
          </Link>
        </div>

        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-8 py-16 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
            暂无公开文章，登录后台开始创作吧。
          </div>
        )}
      </section>

      <section className="space-y-8" id="gallery">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">灵感相册</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              用照片记录每一次创作的瞬间与旅程。
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            查看相册 →
          </Link>
        </div>

        <GalleryGrid images={gallery} />
      </section>
    </div>
  );
}

function HeroSection({ postsCount }: { postsCount: number }) {
  return (
    <header className="relative overflow-hidden rounded-[44px] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 px-8 py-12 text-white shadow-xl sm:px-12 md:px-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs tracking-[0.2em] uppercase">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> 全栈日志
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            清新简约的个人博客，记录代码与生活的灵感
          </h1>
          <p className="text-sm/7 text-blue-100 sm:text-base/7">
            采用最新 Next.js 15 + React 19 技术栈，支持 Markdown 写作、相册照片以及后台管理。
            登录后即可上传图片、发布文章，让创作过程保持顺滑高效。
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href="#posts"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-blue-600 transition hover:bg-blue-50"
            >
              阅读文章
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 px-5 py-2 text-white transition hover:bg-white/10"
            >
              浏览相册
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white/15 px-6 py-5 text-sm backdrop-blur">
          <p>📚 已发布 {postsCount} 篇文章</p>
          <p>🖼️ 支持本地上传封面与相册</p>
          <p>🔐 Google 登录保护后台</p>
        </div>
      </div>
      <div className="pointer-events-none absolute top-10 -right-20 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-32 w-32 rounded-full bg-emerald-400/40 blur-2xl" />
    </header>
  );
}
