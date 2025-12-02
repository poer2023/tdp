import Link from "next/link";
import { PostStatus, PostLocale, type Post } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { t, type AdminLocale } from "@/lib/admin-translations";

type RecentPostsProps = {
  posts: (Post & { author: { name: string | null } | null })[];
  locale: AdminLocale;
  isServiceDegraded?: boolean;
};

export function RecentPosts({ posts, locale, isServiceDegraded = false }: RecentPostsProps) {
  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
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
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t(locale, "postsDataInaccessible")}
          </p>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-500">{t(locale, "noPostsYet")}</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="group">
              <Link
                href={`/admin/posts/${post.id}`}
                className="block rounded-xl p-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="line-clamp-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-500">
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-medium ${
                          post.status === PostStatus.PUBLISHED
                            ? "bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {post.status === PostStatus.PUBLISHED ? "Published" : "Draft"}
                      </span>
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                        {post.locale === PostLocale.EN ? "EN" : "ZH"}
                      </span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(post.updatedAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-stone-600 transition-colors group-hover:text-stone-900 dark:text-stone-500 dark:group-hover:text-stone-300">
                    Edit →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
