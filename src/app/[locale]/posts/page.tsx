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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          {isZh ? "博客文章" : "Blog Posts"}
        </h1>
        <p className="mt-3 text-sm text-zinc-600 sm:mt-4 sm:text-base dark:text-zinc-400">
          {isZh
            ? `共 ${posts.length} 篇文章`
            : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          {isZh ? "暂无文章" : "No posts available"}
        </p>
      ) : (
        <div className="grid gap-6 sm:gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={localePath(l, `/posts/${post.slug}`)}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            >
              <article className="flex flex-col sm:flex-row">
                {/* 封面图 */}
                <div className="relative h-48 w-full shrink-0 overflow-hidden bg-zinc-100 sm:h-auto sm:w-64 dark:bg-zinc-900">
                  {post.coverImagePath ? (
                    <Image
                      src={post.coverImagePath}
                      alt={post.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                      <span className="text-4xl text-zinc-400 dark:text-zinc-600">📝</span>
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 group-hover:text-blue-600 sm:text-2xl dark:text-zinc-100 dark:group-hover:text-blue-400">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 sm:mt-3 dark:text-zinc-400">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* 元信息 */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 sm:gap-4 sm:text-sm dark:text-zinc-400">
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    )}
                    <span>·</span>
                    <span>
                      {calculateReadingTime(post.content, isZh)}{" "}
                      {isZh
                        ? "分钟"
                        : `min${calculateReadingTime(post.content, isZh) > 1 ? "s" : ""}`}
                    </span>
                    {post.viewCount !== undefined && post.viewCount > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {post.viewCount} {isZh ? "次阅读" : "views"}
                        </span>
                      </>
                    )}
                    {post.tags?.length ? (
                      <>
                        <span className="hidden sm:inline">·</span>
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
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
