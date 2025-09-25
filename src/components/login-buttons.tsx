"use client";

import { signIn, signOut } from "next-auth/react";

export function LoginButtons({
  isAuthed,
  callbackUrl,
  userName,
}: {
  isAuthed: boolean;
  callbackUrl: string;
  userName?: string;
}) {
  if (isAuthed) {
    return (
      <div className="space-y-4 text-center">
        {userName ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">已登录：{userName}</p>
        ) : null}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        使用 Google 登录
      </button>
    </div>
  );
}
