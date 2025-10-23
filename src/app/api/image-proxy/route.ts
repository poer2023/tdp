/**
 * Image Proxy API
 *
 * Proxies external images to bypass anti-hotlinking restrictions
 * from platforms like Bilibili and Douban.
 *
 * Usage: /api/image-proxy?url=<encoded_image_url>
 *
 * Features:
 * - Bypasses Referer checks by requesting from server
 * - Caches images with appropriate headers
 * - Supports Bilibili and Douban CDNs
 */

import { NextRequest, NextResponse } from "next/server";

// Allowed image domains (security measure)
const ALLOWED_DOMAINS = [
  "i0.hdslb.com",
  "i1.hdslb.com",
  "i2.hdslb.com",
  "img1.doubanio.com",
  "img2.doubanio.com",
  "img3.doubanio.com",
  "img9.doubanio.com",
];

/**
 * GET /api/image-proxy?url=<image_url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Security: Only allow whitelisted domains
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Domain not allowed", allowed: ALLOWED_DOMAINS },
        { status: 403 }
      );
    }

    // Fetch image from external source with proper headers
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        // Bilibili and Douban accept requests from their own domains
        Referer: parsedUrl.hostname.includes("hdslb.com")
          ? "https://www.bilibili.com/"
          : "https://movie.douban.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      console.error(`[Image Proxy] Failed to fetch ${imageUrl}: ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch image", status: response.status },
        { status: response.status }
      );
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return image with caching headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 7 days (images rarely change)
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        // Allow CORS for our domain
        "Access-Control-Allow-Origin": "*",
        // Prevent caching errors
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Image Proxy] Error:", error);

    // Handle timeout errors
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
