import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";
import { listGalleryImages } from "@/lib/gallery";
import { PostCard } from "@/components/post-card";
import { GalleryGrid } from "@/components/gallery-grid";

export const revalidate = 0;

export default async function Home() {
  const [posts, gallery] = await Promise.all([listPublishedPosts(), listGalleryImages(6)]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-32 px-6 py-20 sm:px-8 md:px-12">
      <HeroSection postsCount={posts.length} />

      <section className="space-y-12" id="posts">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">最新文章</h2>
            <p className="text-lg leading-loose text-zinc-600 dark:text-zinc-400">
              记录我在前端、全栈与生活灵感中的发现
            </p>
          </div>
          <Link
            href="/posts"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
          >
            查看全部文章
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

      <section className="space-y-12" id="gallery">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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

        <GalleryGrid images={gallery} />
      </section>
    </div>
  );
}

function HeroSection({ postsCount }: { postsCount: number }) {
  return (
    <header className="space-y-8 py-12 md:py-20">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="text-5xl leading-tight font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          清新简约的个人博客
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-loose text-zinc-600 dark:text-zinc-400">
          采用最新 Next.js 15 + React 19 技术栈，支持 Markdown 写作、相册照片以及后台管理
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="#posts"
            className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            阅读文章
          </Link>
          <Link
            href="#gallery"
            className="rounded-md border-2 border-zinc-900 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-50"
          >
            浏览相册
          </Link>
        </div>
      </div>
    </header>
  );
}
