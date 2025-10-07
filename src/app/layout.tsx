import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers, cookies } from "next/headers";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { AuthHeader } from "@/components/auth-header";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { MomentComposerBottomSheet } from "@/components/moments/moment-composer";
import { GlobalLanguageSwitcher } from "@/components/global-language-switcher";
import { Search } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";
import { getHtmlLang, getLocaleFromPathname } from "@/lib/i18n";
import { HtmlLangSync } from "@/components/html-lang-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current pathname to determine locale
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";
  // Fallback to cookie in case middleware header is unavailable in client navigations
  const cookieStore = await cookies();
  const cookieLocale = (cookieStore.get("x-locale")?.value as "zh" | "en" | undefined) || undefined;
  const locale = getLocaleFromPathname(pathname) ?? cookieLocale;
  const htmlLang = getHtmlLang(locale);

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang={htmlLang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-zinc-900 antialiased dark:bg-[#1C1C1E] dark:text-zinc-100`}
      >
        {/* Keep <html lang> consistent on client navigations */}
        <HtmlLangSync />
        {/* Early theme applier to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const t=localStorage.getItem('theme');const d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const useDark=t? t==='dark': d;document.documentElement.classList[useDark?'add':'remove']('dark');}catch(e){}})()",
          }}
        />
        <SessionProvider>
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Skip to content
          </a>

          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
              {/* Left cluster: brand + links + search */}
              <div className="flex items-center gap-4">
                <MainNav />
                <div className="hidden sm:block">
                  <Search size="sm" />
                </div>
              </div>
              {/* Right cluster: compact controls */}
              <div className="flex items-center gap-3">
                <ThemeToggle size="sm" />
                <GlobalLanguageSwitcher />
                {/* Mobile search fallback */}
                <div className="sm:hidden">
                  <Search size="sm" />
                </div>
                <AuthHeader />
              </div>
            </div>
          </header>

          <main id="main-content">{children}</main>

          {/* Global mobile composer FAB (hidden on admin) */}
          {!isAdminRoute && <MomentComposerBottomSheet />}

          {!isAdminRoute && <Footer />}
        </SessionProvider>
      </body>
    </html>
  );
}
