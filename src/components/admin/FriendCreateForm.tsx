"use client";

import { useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createFriendFormAction, type CreateFriendFormState } from "@/app/admin/friends/actions";

const initialState: CreateFriendFormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "创建中..." : "创建朋友"}
    </button>
  );
}

export function FriendCreateForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(createFriendFormAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
    >
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200" htmlFor="name">
          朋友昵称
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Alice"
        />
      </div>

      <div>
        <label
          className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
          htmlFor="passphrase"
        >
          访问口令（可选）
        </label>
        <input
          id="passphrase"
          name="passphrase"
          minLength={8}
          placeholder="留空自动生成"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          建议使用至少 8 位数字与字母组合。
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200" htmlFor="avatar">
          头像 URL（可选）
        </label>
        <input
          id="avatar"
          name="avatar"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
          htmlFor="description"
        >
          关系描述（可选）
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="我们一起做过的事情..."
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && state.passphrase && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">创建成功！</p>
          <p className="mt-1">
            访问口令：
            <span className="font-mono text-base">{state.passphrase}</span>
          </p>
          <p className="mt-1 text-xs text-amber-700">
            请及时复制口令并分享给朋友，该信息只显示一次。
          </p>
          <Link
            href="/admin/friends"
            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
          >
            返回朋友列表
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link
          href="/admin/friends"
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          返回列表
        </Link>
      </div>
    </form>
  );
}
