import Link from "next/link";
import { PostStatus, PostLocale, type Post } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { t, type AdminLocale } from "@/lib/admin-translations";
import { Card, CardContent, Chip } from "@/components/ui-heroui";

type RecentPostsProps = {
  posts: (Post & { author: { name: string | null } | null })[];
  locale: AdminLocale;
  isServiceDegraded?: boolean;
};

export function RecentPosts({ posts, locale, isServiceDegraded = false }: RecentPostsProps) {
  return (
    <Card variant="secondary" className="flex min-h-[320px] flex-col">
      <CardContent className="flex h-full flex-col gap-4">
        <h3 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          {t(locale, "recentPosts")}
        </h3>

        {isServiceDegraded ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <svg
              className="h-8 w-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {t(locale, "serviceTemporarilyUnavailable")}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(locale, "postsDataInaccessible")}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">{t(locale, "noPostsYet")}</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="group">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="block rounded-lg p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={post.status === PostStatus.PUBLISHED ? "success" : "default"}
                          className="font-medium"
                        >
                          {post.status === PostStatus.PUBLISHED ? "Published" : "Draft"}
                        </Chip>
                        <Chip size="sm" variant="flat" className="font-medium capitalize">
                          {post.locale === PostLocale.EN ? "EN" : "ZH"}
                        </Chip>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(post.updatedAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                      Edit →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
