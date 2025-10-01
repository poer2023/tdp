import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImagePath ? [post.coverImagePath] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : "草稿";

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:px-8">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
        >
          ← 返回首页
        </Link>
        <time dateTime={post.publishedAt ?? ""}>{formatted}</time>
      </div>

      <article className="space-y-8">
        <header className="space-y-6">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{post.title}</h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
          </div>
          {post.coverImagePath && (
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-zinc-100 dark:border-zinc-800/70 dark:bg-zinc-900">
              <div className="relative aspect-[16/9]">
                <Image
                  src={post.coverImagePath}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {post.tags.map((tag) => (
                <span
                  key={`${post.id}-${tag}`}
                  className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-zinc dark:prose-invert mx-auto max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
