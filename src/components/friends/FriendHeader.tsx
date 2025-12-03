"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { localePath } from "@/lib/locale-path";

interface FriendHeaderProps {
  friend: {
    id: string;
    name: string;
    avatar: string | null;
    description: string | null;
  };
  locale: "en" | "zh";
}

const copy = {
  en: {
    titleSuffix: "'s Story Wall",
    logout: "Log Out",
  },
  zh: {
    titleSuffix: "的故事墙",
    logout: "退出登录",
  },
};

export function FriendHeader({ friend, locale }: FriendHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const text = copy[locale];

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/friends/logout", { method: "POST" });
    } catch (error) {
      console.error("朋友退出失败", error);
    } finally {
      setLoading(false);
      router.push(localePath(locale, "/m/friends"));
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center dark:border-stone-800/60 dark:bg-stone-900/80">
      <div className="flex items-center gap-4">
        {friend.avatar ? (
          <Image
            src={friend.avatar}
            alt={friend.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
            {friend.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {friend.name}
            {text.titleSuffix}
          </h1>
          {friend.description && (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{friend.description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="self-stretch rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:bg-stone-900"
      >
        {text.logout}
      </button>
    </div>
  );
}
