"use client";

import { useEffect, useRef, useActionState, useState, startTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createFriendFormAction, type CreateFriendFormState } from "@/app/admin/friends/actions";
import { ImageUploadField } from "./ImageUploadField";

const initialState: CreateFriendFormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-primary-btn"
    >
      {pending ? "创建中..." : "创建朋友"}
    </button>
  );
}

export function FriendCreateForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(createFriendFormAction, initialState);
  const [avatar, setAvatar] = useState<string>("");
  const [cover, setCover] = useState<string>("");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      startTransition(() => {
        setAvatar("");
        setCover("");
      });
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950/80"
    >
      <div>
        <label className="text-sm font-medium text-stone-700 dark:text-stone-200" htmlFor="name">
          朋友昵称
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-100 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          placeholder="Alice"
        />
      </div>

      <div>
        <label
          className="text-sm font-medium text-stone-700 dark:text-stone-200"
          htmlFor="passphrase"
        >
          访问口令（可选）
        </label>
        <input
          id="passphrase"
          name="passphrase"
          minLength={8}
          placeholder="留空自动生成"
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-100 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          建议使用至少 8 位数字与字母组合。
        </p>
      </div>

      {/* 隐藏字段用于传递上传的图片 URL */}
      <input type="hidden" name="avatar" value={avatar} />
      <input type="hidden" name="cover" value={cover} />

      <ImageUploadField
        label="头像"
        value={avatar}
        onChange={(url) => setAvatar(url)}
        type="avatar"
      />

      <ImageUploadField label="封面" value={cover} onChange={(url) => setCover(url)} type="cover" />

      <div>
        <label
          className="text-sm font-medium text-stone-700 dark:text-stone-200"
          htmlFor="description"
        >
          关系描述（可选）
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="我们一起做过的事情..."
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-100 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
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
            className="mt-2 inline-block text-xs font-medium text-sage-600 hover:underline dark:text-sage-400"
          >
            返回朋友列表
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link
          href="/admin/friends"
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-900"
        >
          返回列表
        </Link>
      </div>
    </form>
  );
}
