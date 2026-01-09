import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

// Use variable fonts for optimal performance (single file, all weights)
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
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-white text-stone-900 antialiased dark:bg-[#1C1C1E] dark:text-stone-100">
        <div className="flex min-h-screen flex-col items-start justify-center px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            {/* 超大 404 标题 */}
            <h1 className="text-[10rem] leading-none font-black tracking-tighter text-stone-900 sm:text-[14rem] md:text-[18rem] lg:text-[22rem] dark:text-stone-100">
              404
            </h1>

            {/* 描述文字 */}
            <p className="mt-6 text-2xl leading-relaxed text-stone-900 sm:mt-8 sm:text-3xl md:text-4xl dark:text-stone-100">
              Seems like we couldn&apos;t find that page, here&apos;s your way back to the{" "}
              <Link
                href="/"
                className="underline decoration-[3px] underline-offset-2 transition hover:text-stone-600 dark:hover:text-stone-300"
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
