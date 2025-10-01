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
      }).format(new Date(post.publishedAt))
    : "草稿";

  return (
    <article className="group overflow-hidden border border-zinc-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={cover}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <time dateTime={post.publishedAt ?? ""}>{formatted}</time>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post.id}-${tag}`}
                  className="font-medium text-zinc-700 dark:text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <h3 className="text-xl leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-base leading-loose text-zinc-600 dark:text-zinc-400">
          {post.excerpt}
        </p>
        <Link
          href={`/posts/${post.slug}`}
          className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100"
        >
          阅读全文
        </Link>
      </div>
    </article>
  );
}
