import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/lib/posts";
import { localePath } from "@/lib/locale-path";
import { Tag } from "@/components/ui/tag";

// Querying Prisma – lock runtime to Node.js
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string }>;
};

// 计算阅读时长（中文：400字/分钟，英文：200词/分钟）
function calculateReadingTime(content: string, isZh: boolean): number {
  const wordsPerMinute = isZh ? 400 : 200;
  const wordCount = content.length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default async function LocalizedPostsPage({ params }: PageProps) {
  const { locale } = await params;

  // Validate locale
  const normalizedLocale = locale.toUpperCase();
  if (normalizedLocale !== "EN" && normalizedLocale !== "ZH") {
    notFound();
  }

  const l = locale === "zh" ? "zh" : "en";
  const isZh = l === "zh";

  // Fetch all published posts via shared lib (supports E2E fallback)
  const posts = await listPublishedPosts();

  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 uppercase sm:text-5xl md:text-6xl dark:text-zinc-100">
          {isZh ? "故事" : "Stories"}
        </h1>
        <p className="mt-2 text-2xl font-light text-zinc-600 sm:text-3xl dark:text-zinc-400">
          {currentYear}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          {isZh ? "暂无文章" : "No posts available"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={localePath(l, `/posts/${post.slug}`)} className="group">
              <article className="flex flex-col">
                {/* 封面图 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {post.coverImagePath ? (
                    <Image
                      src={post.coverImagePath}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                      <span className="text-4xl text-zinc-400 dark:text-zinc-600">📝</span>
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="mt-4 flex flex-col gap-2">
                  {/* 元信息 - 分类 | 日期 */}
                  <div className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {post.tags?.[0] || (isZh ? "文章" : "Article")}
                    {" | "}
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    )}
                  </div>

                  {/* 标题 - 大写 */}
                  <h2 className="text-lg leading-tight font-bold tracking-tight text-zinc-900 uppercase transition group-hover:text-zinc-600 sm:text-xl dark:text-zinc-100 dark:group-hover:text-zinc-300">
                    {post.title}
                  </h2>

                  {/* 描述 */}
                  <p className="line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
