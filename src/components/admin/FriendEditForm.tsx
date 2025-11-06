"use client";

import {
  startTransition as startReactTransition,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  updateFriendProfileFormAction,
  type FriendProfileFormState,
  updateFriendPassphraseAction,
} from "@/app/admin/friends/actions";
import { ImageUploadField } from "./ImageUploadField";

interface FriendEditFormProps {
  friend: {
    id: string;
    name: string;
    avatar: string | null;
    cover: string | null;
    description: string | null;
  };
}

const initialState: FriendProfileFormState = { success: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "保存中..." : "保存修改"}
    </button>
  );
}

export function FriendEditForm({ friend }: FriendEditFormProps) {
  const boundAction = updateFriendProfileFormAction.bind(null, friend.id);
  const [state, formAction] = useActionState(boundAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resetPassphraseAction = updateFriendPassphraseAction.bind(null, friend.id);
  const [avatar, setAvatar] = useState<string>(friend.avatar ?? "");
  const [cover, setCover] = useState<string>(friend.cover ?? "");

  useEffect(() => {
    if (state.success) {
      startReactTransition(() => setShowSuccess(true));
      const timer = window.setTimeout(() => {
        startReactTransition(() => setShowSuccess(false));
      }, 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.success]);

  const handleGeneratePassphrase = () => {
    startTransition(async () => {
      try {
        const result = await resetPassphraseAction();
        setPassphrase(result.passphrase ?? null);
      } catch (error) {
        console.error("生成新口令失败", error);
        setPassphrase(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
      >
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200" htmlFor="name">
            昵称
          </label>
          <input
            id="name"
            name="name"
            defaultValue={friend.name}
            required
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
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

        <ImageUploadField
          label="封面"
          value={cover}
          onChange={(url) => setCover(url)}
          type="cover"
        />

        <div>
          <label
            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
            htmlFor="description"
          >
            关系描述
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={friend.description ?? ""}
            placeholder="我们之间的回忆..."
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <SaveButton />
          <Link
            href="/admin/friends"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            返回列表
          </Link>
        </div>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">安全设置</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          重置该朋友的访问密码并即时生成新密码。
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleGeneratePassphrase}
            disabled={isPending}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "生成中..." : "生成新口令"}
          </button>
          {passphrase && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-medium">新口令</p>
              <p className="mt-1 font-mono text-base">{passphrase}</p>
              <p className="mt-1 text-[11px]">请立即复制并通知朋友，该口令只显示一次。</p>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          信息已更新。
        </div>
      )}
    </div>
  );
}
