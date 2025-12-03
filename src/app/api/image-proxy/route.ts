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
import sharp from "sharp";
import { getAllowedImageProxyDomains } from "@/lib/image-proxy";

// Allowed image domains (security measure)
const ALLOWED_DOMAINS = getAllowedImageProxyDomains();

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
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(new Uint8Array(arrayBuffer));
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const isImage = contentType.startsWith("image/");
    const isAnimated = contentType.includes("gif");
    const alreadyWebP = contentType.includes("webp");

    let optimizedBuffer: Buffer = imageBuffer;
    let outputContentType = contentType;

    // Convert to WebP when safe to do so; fall back to original on failure/unsupported types
    if (isImage && !isAnimated && !alreadyWebP) {
      try {
        optimizedBuffer = await sharp(imageBuffer)
          .webp({ quality: 78, effort: 4 })
          .toBuffer();
        outputContentType = "image/webp";
      } catch (err) {
        console.warn("[Image Proxy] WebP conversion failed, returning original", err);
        optimizedBuffer = imageBuffer;
        outputContentType = contentType;
      }
    }

    // Return image with caching headers
    return new NextResponse(optimizedBuffer, {
      status: 200,
      headers: {
        "Content-Type": outputContentType,
        "Content-Length": optimizedBuffer.byteLength.toString(),
        // Cache for 7 days (images rarely change)
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable",
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
