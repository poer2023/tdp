import { notFound } from "next/navigation";
import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";
import { localePath } from "@/lib/locale-path";

// Querying Prisma – lock runtime to Node.js
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string }>;
};

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
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-zinc-200 pb-12 dark:border-zinc-800">
              <Link href={localePath(l, `/posts/${post.slug}`)} className="group">
                <h2 className="text-2xl font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                {post.author?.name && <span>{post.author.name}</span>}
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
                {post.tags?.length ? (
                  <span className="text-blue-600 dark:text-blue-400">{post.tags.join(", ")}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
