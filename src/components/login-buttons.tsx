"use client";

import { signIn, signOut } from "next-auth/react";
import { EmailLoginForm } from "@/components/email-login-form";
import { useState } from "react";

export function LoginButtons({
  isAuthed,
  callbackUrl,
  userName,
}: {
  isAuthed: boolean;
  callbackUrl: string;
  userName?: string;
}) {
  const [showEmailLogin, setShowEmailLogin] = useState(false);

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
      {!showEmailLogin ? (
        <>
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            使用 Google 登录
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                或
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowEmailLogin(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            使用邮箱登录
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setShowEmailLogin(false)}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回其他登录方式
          </button>
          <EmailLoginForm callbackUrl={callbackUrl} />
        </div>
      )}
    </div>
  );
}
