"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FriendAuthFormProps {
  locale: "en" | "zh";
}

const messages = {
  en: {
    slugLabel: "Friend ID",
    slugHint: "Enter the identifier you received.",
    passwordLabel: "Password",
    submit: "View Stories",
    verifying: "Verifying...",
    genericError: "Something went wrong. Please try again.",
    networkError: "Network error. Please try again later.",
    attempts: "Attempts remaining",
    locked: "Too many attempts. Please try again later.",
  },
  zh: {
    slugLabel: "朋友标识",
    slugHint: "请输入你收到的朋友标识",
    passwordLabel: "密码",
    submit: "查看故事",
    verifying: "验证中...",
    genericError: "发生错误，请稍后再试。",
    networkError: "网络错误，请稍后重试。",
    attempts: "剩余尝试次数",
    locked: "尝试次数过多，请稍后再试。",
  },
};

export function FriendAuthForm({ locale }: FriendAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectSlug = searchParams.get("redirect");

  const [slug, setSlug] = useState(redirectSlug ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const copy = messages[locale];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAttemptsRemaining(null);
    setLoading(true);

    try {
      const normalizedSlug = slug.trim();
      const res = await fetch("/api/friends/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: normalizedSlug, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(copy.locked);
        } else if (res.status === 401) {
          setError(typeof data.error === "string" ? data.error : copy.genericError);
          if (typeof data.attemptsRemaining === "number") {
            setAttemptsRemaining(data.attemptsRemaining);
          }
        } else {
          setError(typeof data.error === "string" ? data.error : copy.genericError);
        }
        return;
      }

      router.push(`/${locale}/m/friends/${normalizedSlug}`);
      router.refresh();
    } catch (err) {
      console.error("朋友认证请求失败", err);
      setError(copy.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          {attemptsRemaining !== null && (
            <p className="mt-1 text-xs text-red-600">
              {copy.attempts}: {attemptsRemaining}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="friend-slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {copy.slugLabel}
        </label>
        <input
          id="friend-slug"
          type="text"
          autoComplete="username"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="alice"
          required
          disabled={loading}
          className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{copy.slugHint}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="friend-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {copy.passwordLabel}
        </label>
        <input
          id="friend-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? copy.verifying : copy.submit}
      </button>
    </form>
  );
}
