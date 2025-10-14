import { CreatePostForm } from "../create-post-form";

export const revalidate = 0;

export default function AdminNewPostPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Posts</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          创建新文章
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">填写内容并发布一篇新文章。</p>
      </header>

      <CreatePostForm />
    </div>
  );
}
