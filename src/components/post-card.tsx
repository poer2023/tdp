import Image from "next/image";
import Link from "next/link";
import type { PublicPost } from "@/lib/posts";
import { toOptimizedImageUrl } from "@/lib/image-proxy";

interface PostCardProps {
  post: PublicPost;
  locale?: "zh" | "en";
}

export function PostCard({ post, locale = "zh" }: PostCardProps) {
  const cover = toOptimizedImageUrl(post.coverImagePath) ?? "/images/placeholder-cover.svg";
  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : locale === "zh"
      ? "草稿"
      : "Draft";

  return (
    <article className="group overflow-hidden border border-stone-200 bg-white transition dark:border-stone-800 dark:bg-stone-900">
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-stone-800">
        <Image
          src={cover}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <time dateTime={post.publishedAt ?? ""}>{formatted}</time>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post.id}-${tag}`}
                  className="font-medium text-stone-700 dark:text-stone-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <h3 className="text-xl leading-snug font-semibold text-stone-900 dark:text-stone-50">
          <Link href={`/${locale}/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-base leading-loose text-stone-600 dark:text-stone-400">
          {post.excerpt}
        </p>
        <Link
          href={`/${locale}/posts/${encodeURIComponent(post.slug)}`}
          className="text-sm font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600 dark:text-stone-100"
        >
          {locale === "zh" ? "阅读全文" : "Read more"}
        </Link>
      </div>
    </article>
  );
}
