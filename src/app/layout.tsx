import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getHtmlLang } from "@/lib/i18n";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { MomentComposerLoader } from "@/components/moments/moment-composer-loader";

// ISR: Allow Next.js to auto-detect caching strategy
export const dynamic = "auto";

const geistSans = localFont({
  src: [{ path: "../../public/fonts/geist-sans/Geist-Variable.woff2", weight: "100 900" }],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [{ path: "../../public/fonts/geist-mono/GeistMono-Variable.woff2", weight: "100 900" }],
  variable: "--font-geist-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZHI·Soft Hours",
    template: "%s · ZHI·Soft Hours",
  },
  description: "使用最新 Next.js 15、React 19 与 Tailwind CSS 4 打造的全栈个人博客示例。",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    title: "ZHI·Soft Hours",
    description: "使用最新 Next.js 15、React 19 与 Tailwind CSS 4 打造的全栈个人博客示例。",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current pathname to determine locale
  // 默认语言；客户端使用 HtmlLangSync 根据路径同步 lang
  const htmlLang = getHtmlLang("en");

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col overflow-x-hidden bg-white text-stone-900 antialiased dark:bg-[#1C1C1E] dark:text-stone-100`}
      >
        {/* Early theme applier to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const t=localStorage.getItem('theme');const d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const useDark=t? t==='dark': d;document.documentElement.classList[useDark?'add':'remove']('dark');}catch(e){}})()",
          }}
        />
        {/* Keep <html lang> consistent on client navigations */}
        <HtmlLangSync />
        <ThemeProvider>
          <SessionProvider>
            <ConfirmProvider>
              {/* Skip to content link for accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Skip to content
              </a>

              <main id="main-content" className="flex-1">
                {children}
              </main>

              {/* Global mobile composer FAB (hidden on admin via client check) */}
              <MomentComposerLoader />
            </ConfirmProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
