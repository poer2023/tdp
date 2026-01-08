import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginButtons } from "@/components/auth/login-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const callbackUrl = sp.callbackUrl ?? "/";

  // If user is already authenticated, redirect to the callback URL
  if (session?.user) {
    redirect(callbackUrl);
  }


  return (
    <div className="flex min-h-screen">
      {/* Left Brand Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-stone-900 p-16 text-white relative overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-900/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="font-serif text-4xl font-bold tracking-tighter mb-4">
            ZHI<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-stone-400 max-w-sm font-light">
            个人数字花园，记录、分享与思考的空间。
          </p>
        </div>

        {/* Quote */}
        <div className="relative z-10">
          <blockquote className="font-serif text-2xl italic leading-relaxed text-stone-200 opacity-80 mb-6">
            &quot;Light is not so much something that reveals, as it is itself the revelation.&quot;
          </blockquote>
          <div className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-stone-500">
            <span className="w-8 h-[1px] bg-stone-600" />
            James Turrell
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-stone-600">
          © {new Date().getFullYear()} Zhi. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-12 lg:px-24 bg-stone-50 dark:bg-stone-950 relative">
        {/* Back to Home - Desktop */}
        <Link
          href="/"
          className="absolute top-8 left-8 hidden lg:flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="max-w-md w-full mx-auto">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden mb-10">
            <h1 className="font-serif text-3xl font-bold tracking-tighter text-stone-900 dark:text-stone-100">
              ZHI<span className="text-emerald-500">.</span>
            </h1>
          </div>

          {/* Welcome Header */}
          <div className="mb-10">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-900 dark:text-stone-100 mb-6 shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              </svg>
            </div>
            <h2 className="font-serif text-4xl text-stone-900 dark:text-stone-100 mb-3">
              Welcome Back
            </h2>
            <p className="text-stone-500 dark:text-stone-400">
              Please sign in to manage your content.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <LoginButtons
              isAuthed={Boolean(session?.user)}
              callbackUrl={callbackUrl}
              userName={session?.user?.name ?? session?.user?.email ?? ""}
            />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-stone-400 dark:text-stone-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
