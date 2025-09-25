import { listPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export const revalidate = 0;

export default async function PostsPage() {
  const posts = await listPublishedPosts();

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-12 sm:px-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">全部文章</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          支持 Markdown 排版、封面配图与标签分类，记录每一次的灵感闪现。
        </p>
      </header>

      {posts.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          暂无文章。
        </p>
      )}
    </div>
  );
}
