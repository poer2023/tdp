import Image from "next/image";
import Link from "next/link";
import type { PublicPost } from "@/lib/posts";

interface PostCardProps {
  post: PublicPost;
}

export function PostCard({ post }: PostCardProps) {
  const cover = post.coverImagePath ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(post.publishedAt)
    : "草稿";

  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900/80">
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={cover}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <time dateTime={post.publishedAt?.toISOString() ?? ""}>{formatted}</time>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post.id}-${tag}`}
                  className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{post.excerpt}</p>
        <Link
          href={`/posts/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
        >
          阅读全文
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
