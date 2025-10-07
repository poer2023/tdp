import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { pinyin } from "pinyin-pro";

// Language preference detection helper
function pickPreferredLocale(acceptLanguage: string | null): "zh" | "en" {
  const al = (acceptLanguage || "").toLowerCase();
  // Match zh, zh-cn, zh-hans, etc.
  return /\bzh\b|zh-cn|zh-hans/.test(al) ? "zh" : "en";
}

// Unified middleware
// - Adds `x-pathname` header for locale detection in layout
// - Enforces ADMIN role for `/admin/*` pages
// - Localized routing rules:
//   · English is default (no /en prefix). Keep `/` as English.
//   · Chinese uses /zh prefix. Redirect `/` → `/zh` only when browser prefers Chinese.
//   · Redirect any `/en` or `/en/*` URL to the prefix-free path to hide /en.
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1) Root path: redirect only when Chinese is preferred
  if (pathname === "/") {
    const pref = pickPreferredLocale(request.headers.get("accept-language"));
    if (pref === "zh") {
      const url = new URL(`/zh`, request.nextUrl.origin);
      searchParams.forEach((v, k) => url.searchParams.set(k, v));
      return NextResponse.redirect(url, { status: 302 });
    }
  }

  // 2) Hide /en prefix: permanently redirect to prefix-free path
  if (pathname === "/en" || pathname === "/en/") {
    const url = new URL(`/`, request.nextUrl.origin);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return NextResponse.redirect(url, { status: 308 });
  }
  if (pathname.startsWith("/en/")) {
    const rest = pathname.slice("/en".length);
    const url = new URL(rest || "/", request.nextUrl.origin);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return NextResponse.redirect(url, { status: 308 });
  }

  // Always attach pathname header for i18n html lang resolution
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  // Derive locale from pathname for a reliable client navigation fallback
  const currentLocale = pathname.startsWith("/zh") ? "zh" : "en";

  // Handle Chinese slug redirects (PostAlias-like behavior) for posts
  // Matches: /posts/:slug or /zh/posts/:slug
  const postPathMatch = pathname.match(/^\/(zh\/)?posts\/([^/]+)$/);
  if (postPathMatch) {
    const hasZhPrefix = Boolean(postPathMatch[1]);
    const rawSlug = postPathMatch[2] || "";

    try {
      const decoded = decodeURIComponent(rawSlug);
      // If slug contains CJK characters, redirect to pinyin slug
      if (/[\u4e00-\u9fa5]/.test(decoded)) {
        // Basic slugify using pinyin-pro and ASCII cleanup
        let ascii = decoded;
        try {
          ascii =
            (pinyin(decoded, { toneType: "none", type: "string", v: true }) as string) || decoded;
        } catch {
          ascii = decoded;
        }
        const normalized = ascii
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        if (normalized && normalized !== rawSlug) {
          const newPath = hasZhPrefix ? `/zh/posts/${normalized}` : `/posts/${normalized}`;
          const redirectUrl = new URL(newPath, request.nextUrl.origin);
          // Preserve query parameters
          searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
          return NextResponse.redirect(redirectUrl, { status: 301 });
        }
      }
    } catch {
      // If decode fails, continue without redirect
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request });

    // Unauthenticated → redirect to login (tests accept 302 here)
    if (!token) {
      const redirectUrl = new URL("/login", request.nextUrl.origin);
      const q = searchParams.toString();
      redirectUrl.searchParams.set("callbackUrl", `${pathname}${q ? `?${q}` : ""}`);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    // Authenticated but not ADMIN → return 403 (tests expect 401/403)
    if ((token as { role?: string })?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403, headers: requestHeaders });
    }
  }

  // Default pass-through with augmented headers and locale cookie
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  try {
    res.cookies.set("x-locale", currentLocale, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch {}
  return res;
}

export const config = {
  matcher: [
    // Run on all pages except API/static/image assets
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
