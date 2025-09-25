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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">登录后台</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          使用 Google 登录以管理文章和相册内容。
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
