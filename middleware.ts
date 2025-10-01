import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { PostLocale } from "@prisma/client";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Handle PostAlias redirects for old slugs
  // Matches: /posts/:slug or /zh/posts/:slug
  const postPathMatch = pathname.match(/^\/(zh\/)?posts\/([^/]+)$/);
  if (postPathMatch) {
    const locale = postPathMatch[1] ? PostLocale.ZH : PostLocale.EN;
    const slug = postPathMatch[2];

    if (!slug) {
      return NextResponse.next();
    }

    // Check if this is an old slug that needs redirect
    const alias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale,
          oldSlug: slug,
        },
      },
      include: {
        post: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (alias?.post) {
      const newPath =
        locale === PostLocale.ZH ? `/zh/posts/${alias.post.slug}` : `/posts/${alias.post.slug}`;

      const redirectUrl = new URL(newPath, req.nextUrl.origin);

      // Preserve query parameters
      searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });

      // Log redirect for monitoring
      console.log(`[PostAlias 301] ${pathname} → ${newPath}`);

      return NextResponse.redirect(redirectUrl, { status: 301 });
    }
  }

  // Admin authentication check
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({ req });
  if (!token) {
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    redirectUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/posts/:slug*", "/zh/posts/:slug*"],
};
