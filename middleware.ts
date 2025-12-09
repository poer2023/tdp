import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

// Unified middleware
// - Adds `x-pathname` header for locale detection in layout
// - Enforces ADMIN role for `/admin/*` pages
// - Localized routing rules:
//   · English is default (no /en prefix). Keep `/` and child paths as English.
//   · Chinese uses /zh prefix, only when user explicitly switches.
//   · Redirect legacy `/en` URLs to prefix-free equivalents.

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0] ?? "";

  // Redirect legacy /en paths to prefix-free equivalents (301 to preserve SEO)
  if (firstSegment === "en") {
    const remaining = pathSegments.slice(1).join("/");
    const normalizedPath = remaining ? `/${remaining}` : "/";
    const redirectUrl = new URL(normalizedPath, request.nextUrl.origin);
    searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // Always attach pathname header for i18n html lang resolution
  const requestHeaders = new Headers(request.headers);

  // Derive locale from pathname
  const currentLocale = pathname.startsWith("/zh") ? "zh" : "en";
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-locale", currentLocale);

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
        // Basic slugify using pinyin-pro and ASCII cleanup (lazy-loaded to keep middleware lean)
        let ascii = decoded;
        try {
          const { pinyin } = await import("pinyin-pro");
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

  const friendStoryMatch = pathname.match(/^\/(zh\/)?m\/friends\/([^/]+)$/);
  if (friendStoryMatch && friendStoryMatch[2]) {
    const hasZhPrefix = Boolean(friendStoryMatch[1]);
    const slug = friendStoryMatch[2];
    const token = request.cookies.get("friendAuth")?.value;

    if (!token) {
      const redirectUrl = new URL(hasZhPrefix ? "/zh/m/friends" : "/m/friends", request.nextUrl.origin);
      redirectUrl.searchParams.set("redirect", slug);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie =
      request.cookies.get("next-auth.session-token") ??
      request.cookies.get("__Secure-next-auth.session-token") ??
      request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token") ??
      request.cookies.get("__Host-authjs.session-token") ??
      null;
    const sessionToken = sessionCookie?.value ?? null;
    const sessionSalt = sessionCookie?.name ?? "authjs.session-token";
    let role: string | null = null;

    if (sessionToken) {
      try {
        const decoded = await decode({
          token: sessionToken,
          secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "",
          salt: sessionSalt,
        });
        role = (decoded?.role as string | undefined) ?? null;
      } catch {
        role = null;
      }
    }

    // Unauthenticated → redirect to login (tests accept 302 here)
    if (!sessionToken) {
      const redirectUrl = new URL("/login", request.nextUrl.origin);
      const q = searchParams.toString();
      redirectUrl.searchParams.set("callbackUrl", `${pathname}${q ? `?${q}` : ""}`);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    // Authenticated but not ADMIN → return 403 (tests expect 401/403)
    if (role !== "ADMIN") {
      const forbiddenHtml = `<!DOCTYPE html><html lang="${currentLocale}">
        <head>
          <meta charset="utf-8" />
          <title>403 Forbidden</title>
          <style>
            body{font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;margin:0;padding:0;background:#f4f4f5;color:#18181b;}
            main{display:flex;min-height:100vh;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;}
            h1{font-size:3rem;margin-bottom:1rem;}
            p{color:#52525b;margin-bottom:1.5rem;}
            a{color:#2563eb;text-decoration:none;font-weight:600;}
          </style>
        </head>
        <body>
          <main>
            <h1>403</h1>
            <p>Forbidden - Admin access required</p>
            <a href="/">Return to Home</a>
          </main>
        </body>
      </html>`;
      return new NextResponse(forbiddenHtml, {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });
    }
  }

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
    // Run on all pages except API/static assets
    "/((?!api|_next|favicon.ico|icon.png).*)",
  ],
};
