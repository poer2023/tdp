import { auth } from "@/auth";
import { LoginButtons } from "@/components/login-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const session = await auth();
  const callbackUrl = searchParams?.callbackUrl ?? "/admin";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 md:py-16">
      <div className="space-y-3 text-center sm:space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-zinc-50">
          登录后台
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          使用 Google 或邮箱登录以管理文章和相册内容。
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-900/80">
        <LoginButtons
          isAuthed={Boolean(session?.user)}
          callbackUrl={callbackUrl}
          userName={session?.user?.name ?? session?.user?.email ?? ""}
        />
      </div>
    </div>
  );
}
