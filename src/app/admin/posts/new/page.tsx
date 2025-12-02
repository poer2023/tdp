import { features } from "@/config/features";
import { CreatePostForm } from "../create-post-form";

export const revalidate = 0;

export default function AdminNewPostPage() {
  if (!features.get("adminPosts")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Posts</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            创建新文章
          </h1>
        </header>
        <section className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          已禁用文章管理功能。启用
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5 text-xs text-stone-700">
            FEATURE_ADMIN_POSTS
          </code>
          后可继续创建文章。
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Posts</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
          创建新文章
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">填写内容并发布一篇新文章。</p>
      </header>

      <CreatePostForm />
    </div>
  );
}
