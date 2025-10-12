"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface EmailLoginFormProps {
  callbackUrl: string;
}

type Step = "email" | "code";

export function EmailLoginForm({ callbackUrl }: EmailLoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSending(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("请输入有效的邮箱地址");
        return;
      }

      const response = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "发送验证码失败，请稍后重试");
        return;
      }

      setStep("code");
      setCode("");
      setCountdown(60);
      setStatus("验证码已发送，请查收邮箱。");
    } catch (err) {
      console.error("Send code error:", err);
      setError("发送验证码失败，请稍后重试");
    } finally {
      setIsSending(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isSending) {
      return;
    }
    setError("");
    setStatus("");
    setIsSending(true);

    try {
      const response = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "重新发送失败，请稍后重试");
        return;
      }

      setCountdown(60);
      setStatus("验证码已重新发送，请注意查收。");
    } catch (err) {
      console.error("Resend code error:", err);
      setError("重新发送失败，请稍后重试");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsVerifying(true);

    try {
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setError("请输入验证码");
        return;
      }

      const result = await signIn("email", {
        email,
        token: trimmedCode,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setError("验证失败，请稍后重试");
        return;
      }

      if (result.error || result.ok === false) {
        setError("验证码错误或已过期，请重新输入");
        return;
      }

      setStatus("登录成功，正在跳转...");
      const redirectUrl = result.url ?? callbackUrl;
      router.replace(redirectUrl);
      router.refresh();
    } catch (err) {
      console.error("Verify code error:", err);
      setError("验证失败，请稍后重试");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setError("");
    setStatus("");
    setCountdown(0);
  };

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              required
              disabled={isSending}
              autoComplete="email"
              aria-label="邮箱地址"
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {status ? (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {status}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSending || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                发送中...
              </>
            ) : (
              "发送验证码"
            )}
          </button>

          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            我们将向您的邮箱发送一次性验证码和登录链接
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <p className="mb-1 font-medium">✉️ 验证邮件已发送至</p>
            <p className="font-mono">{email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label
                htmlFor="verification-code"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                输入验证码
              </label>
              <input
                id="verification-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="请输入 6 位验证码"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label="验证码"
              />
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {status}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isVerifying || code.trim().length < 6}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  验证中...
                </>
              ) : (
                "验证并登录"
              )}
            </button>
          </form>

          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>验证码有效期为 10 分钟。</p>
            <p>如果未收到邮件，请检查垃圾箱或稍后重试。</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              返回
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || isSending}
              className="flex-1 rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
