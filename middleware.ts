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
//
// NOTE: Chinese slug to pinyin conversion is handled server-side in the page/API routes,
// not in middleware, because pinyin-pro requires Node.js runtime (uses 'stream' module).

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

  // Flatten legacy /about/live routes to /about (301 to preserve SEO)
  const hasZhPrefix = pathname.startsWith("/zh");
  const pathWithoutLocale = hasZhPrefix ? pathname.slice(3) || "/" : pathname;
  if (pathWithoutLocale.startsWith("/about/live")) {
    const flattenedPath = pathWithoutLocale.replace(/^\/about\/live/, "/about") || "/about";
    const redirectPath = hasZhPrefix ? `/zh${flattenedPath}` : flattenedPath;
    const redirectUrl = new URL(redirectPath, request.nextUrl.origin);
    searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // Always attach pathname header for i18n html lang resolution
  const requestHeaders = new Headers(request.headers);

  // Derive locale from pathname
  const currentLocale = pathname.startsWith("/zh") ? "zh" : "en";
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-locale", currentLocale);

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
    // Use JWT decode for Edge Runtime compatibility (do not import auth.ts which uses Node.js modules)
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

    // Unauthenticated → redirect to login
    if (!sessionToken) {
      const redirectUrl = new URL("/login", request.nextUrl.origin);
      const q = searchParams.toString();
      redirectUrl.searchParams.set("callbackUrl", `${pathname}${q ? `?${q}` : ""}`);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    // Authenticated but not ADMIN → rewrite to /403 page with locale preserved
    if (role !== "ADMIN") {
      const forbiddenUrl = new URL("/403", request.nextUrl.origin);
      return NextResponse.rewrite(forbiddenUrl, {
        status: 403,
        request: { headers: requestHeaders },
      });
    }
  }

  // Note: We no longer set x-locale cookie to preserve CDN caching.
  // Locale is derived from the URL path (x-locale header is still set for server components).
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Run on all pages except API/static assets
    "/((?!api|_next|favicon.ico|icon.png).*)",
  ],
};
