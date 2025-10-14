import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <title>404 - Page Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Early theme applier to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const t=localStorage.getItem('theme');const d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const useDark=t? t==='dark': d;document.documentElement.classList[useDark?'add':'remove']('dark');}catch(e){}})()",
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-900 antialiased dark:bg-[#1C1C1E] dark:text-zinc-100">
        <div className="flex min-h-screen flex-col items-start justify-center px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            {/* 超大 404 标题 */}
            <h1 className="text-[10rem] leading-none font-black tracking-tighter text-zinc-900 sm:text-[14rem] md:text-[18rem] lg:text-[22rem] dark:text-zinc-100">
              404
            </h1>

            {/* 描述文字 */}
            <p className="mt-6 text-2xl leading-relaxed text-zinc-900 sm:mt-8 sm:text-3xl md:text-4xl dark:text-zinc-100">
              Seems like we couldn&apos;t find that page, here&apos;s your way back to the{" "}
              <Link
                href="/"
                className="underline decoration-[3px] underline-offset-2 transition hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                homepage
              </Link>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
