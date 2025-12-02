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
        setError("Please enter a valid email address");
        return;
      }

      const response = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to send code. Please try again.");
        return;
      }

      setStep("code");
      setCode("");
      setCountdown(60);
      setStatus("Verification code sent. Please check your inbox.");
    } catch (err) {
      console.error("Send code error:", err);
      setError("Failed to send code. Please try again.");
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
        setError(data?.error ?? "Failed to resend. Please try again.");
        return;
      }

      setCountdown(60);
      setStatus("Code resent. Please check your inbox.");
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Failed to resend. Please try again.");
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
        setError("Please enter the verification code");
        return;
      }

      const result = await signIn("email", {
        email,
        token: trimmedCode,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setError("Verification failed. Please try again.");
        return;
      }

      if (result.error || result.ok === false) {
        setError("Invalid or expired code. Please try again.");
        return;
      }

      setStatus("Success! Redirecting...");
      const redirectUrl = result.url ?? callbackUrl;
      router.replace(redirectUrl);
      router.refresh();
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Verification failed. Please try again.");
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
              className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-500/20 focus:outline-none dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
              required
              disabled={isSending}
              autoComplete="email"
              aria-label="Email address"
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
              {error}
            </div>
          ) : null}

          {status ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              {status}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSending || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
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
                Sending...
              </>
            ) : (
              "Send verification code"
            )}
          </button>

          <div className="text-center text-xs text-stone-500 dark:text-stone-400">
            We&apos;ll send a one-time code to your email
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700 dark:bg-stone-700 dark:text-stone-300">
            <p className="mb-1 font-medium">✉️ Verification email sent to</p>
            <p className="font-mono text-xs">{email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label
                htmlFor="verification-code"
                className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                Verification code
              </label>
              <input
                id="verification-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-500/20 focus:outline-none dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label="Verification code"
              />
            </div>

            {error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {status}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isVerifying || code.trim().length < 6}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
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
                  Verifying...
                </>
              ) : (
                "Verify and sign in"
              )}
            </button>
          </form>

          <div className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
            <p>Code expires in 10 minutes.</p>
            <p>If you don&apos;t see the email, check your spam folder.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="flex-1 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || isSending}
              className="flex-1 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
            >
              {countdown > 0 ? `Resend (${countdown}s)` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
