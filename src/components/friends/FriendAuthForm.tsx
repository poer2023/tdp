"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FriendAuthFormProps {
  locale: "en" | "zh";
}

const messages = {
  en: {
    passphraseLabel: "Passphrase",
    passphraseHint: "Enter the secret passphrase you received.",
    submit: "Unlock Stories",
    verifying: "Verifying...",
    genericError: "Something went wrong. Please try again.",
    networkError: "Network error. Please try again later.",
    locked: "Too many attempts. Please try again later.",
  },
  zh: {
    passphraseLabel: "口令",
    passphraseHint: "请输入你收到的专属口令",
    submit: "解锁故事",
    verifying: "验证中...",
    genericError: "发生错误，请稍后再试。",
    networkError: "网络错误，请稍后重试。",
    locked: "尝试次数过多，请稍后再试。",
  },
};

export function FriendAuthForm({ locale }: FriendAuthFormProps) {
  const router = useRouter();

  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const copy = messages[locale];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/friends/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: passphrase.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(copy.locked);
        } else {
          setError(typeof data.error === "string" ? data.error : copy.genericError);
        }
        return;
      }

      // 认证成功，强制刷新页面显示内容
      window.location.reload();
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
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="friend-passphrase"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          {copy.passphraseLabel}
        </label>
        <input
          id="friend-passphrase"
          type="password"
          autoComplete="off"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="••••••••••••"
          required
          disabled={loading}
          className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{copy.passphraseHint}</p>
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
