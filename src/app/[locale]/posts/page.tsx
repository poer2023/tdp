import { notFound } from "next/navigation";
import Link from "next/link";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

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

  const postLocale = normalizedLocale as PostLocale;
  const isZh = postLocale === PostLocale.ZH;

  // Fetch posts for this locale
  const posts = await prisma.post.findMany({
    where: {
      locale: postLocale,
      status: PostStatus.PUBLISHED,
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
          {isZh ? "博客文章" : "Blog Posts"}
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {isZh
            ? `共 ${posts.length} 篇中文文章`
            : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          {isZh ? "暂无中文文章" : "No posts available"}
        </p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-zinc-200 pb-12 dark:border-zinc-800">
              <Link href={`/${locale}/posts/${post.slug}`} className="group">
                <h2 className="text-2xl font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                {post.author?.name && <span>{post.author.name}</span>}
                {post.publishedAt && (
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
                {post.tags && <span className="text-blue-600 dark:text-blue-400">{post.tags}</span>}
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
