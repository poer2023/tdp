import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export const revalidate = 0;

export default async function AdminHomePage() {
  const session = await auth();
  const [totalPosts, publishedPosts, draftPosts, galleryCount] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.galleryImage.count(),
  ]);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Admin</p>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">内容概览</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          欢迎回来，{session?.user?.name ?? "管理员"}。在这里快速查看最新的创作数据。
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="文章总数" value={totalPosts.toString()} accent="bg-blue-500" />
        <StatCard title="已发布" value={publishedPosts.toString()} accent="bg-emerald-500" />
        <StatCard title="草稿" value={draftPosts.toString()} accent="bg-amber-500" />
        <StatCard title="相册照片" value={galleryCount.toString()} accent="bg-purple-500" />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">快速操作</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <li>→ 在「文章管理」中编写 Markdown 内容并上传封面。</li>
            <li>→ 在「相册」板块上传更多配图，提升首页的视觉体验。</li>
            <li>→ 若需邀请他人协作，可将其设为 AUTHOR 角色。</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-dashed border-blue-300 bg-blue-50/80 p-6 text-sm text-blue-800 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <h2 className="text-lg font-semibold">接下来可以做什么？</h2>
          <p className="mt-3 leading-6">
            · 自定义域名并部署到 Vercel。
            <br />· 使用 Prisma Client 编写更多统计接口。
            <br />· 集成评论系统或订阅邮件，为博客读者提供互动渠道。
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <div className="mt-6 flex items-end gap-3">
        <span className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
        <span className={`inline-flex h-2 w-12 rounded-full ${accent}`} aria-hidden />
      </div>
    </div>
  );
}
