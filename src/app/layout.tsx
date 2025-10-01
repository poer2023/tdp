import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { AuthHeader } from "@/components/auth-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hao · 全栈博客",
    template: "%s · Hao 的全栈博客",
  },
  description: "使用最新 Next.js 15、React 19 与 Tailwind CSS 4 打造的全栈个人博客示例。",
  openGraph: {
    title: "Hao · 全栈博客",
    description: "使用最新 Next.js 15、React 19 与 Tailwind CSS 4 打造的全栈个人博客示例。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <SessionProvider>
          <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <nav className="flex items-center gap-8">
                <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Hao
                </Link>
                <Link
                  href="/posts"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Blog
                </Link>
                <Link
                  href="/gallery"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Gallery
                </Link>
              </nav>
              <AuthHeader />
            </div>
          </header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
