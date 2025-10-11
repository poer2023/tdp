import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getLocalUploadRoot } from "@/lib/storage/local-paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: { path: string[] } };

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, "");
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

function buildHeaders(stats: { size: number; mtime: Date }) {
  const etag = `"${stats.size}-${Math.floor(stats.mtime.getTime())}"`;
  return {
    etag,
    lastModified: stats.mtime.toUTCString(),
    cacheControl: "public, max-age=31536000, immutable",
  };
}

async function resolveFile(request: NextRequest, params: string[]) {
  void request;
  const uploadsRoot = path.resolve(getLocalUploadRoot()) + path.sep;
  const filePath = path.resolve(uploadsRoot, ...params);

  if (!filePath.startsWith(uploadsRoot)) {
    return { status: 403 as const };
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return { status: 404 as const };
    }
    return { status: 200 as const, filePath, stats };
  } catch {
    return { status: 404 as const };
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { path: pathSegments } = await params;
  const resolved = await resolveFile(request, pathSegments);
  if (resolved.status !== 200) {
    return new NextResponse("Not Found", { status: resolved.status });
  }

  const { filePath, stats } = resolved;
  const { etag, lastModified, cacheControl } = buildHeaders(stats);

  // Conditional requests
  const inm = request.headers.get("if-none-match");
  if (inm && inm === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": cacheControl,
      },
    });
  }

  const ims = request.headers.get("if-modified-since");
  if (ims) {
    const since = Date.parse(ims);
    // HTTP dates are second-precision, so compare at second level
    if (
      !Number.isNaN(since) &&
      Math.floor(stats.mtime.getTime() / 1000) <= Math.floor(since / 1000)
    ) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Last-Modified": lastModified,
          "Cache-Control": cacheControl,
        },
      });
    }
  }

  const data = await readFile(filePath);
  const uint8 = new Uint8Array(data);
  const mime = getMimeType(filePath);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stats.size),
      "Cache-Control": cacheControl,
      ETag: etag,
      "Last-Modified": lastModified,
    },
  });
}

export async function HEAD(request: NextRequest, { params }: Params) {
  const { path: pathSegments } = await params;
  const resolved = await resolveFile(request, pathSegments);
  if (resolved.status !== 200) {
    return new NextResponse("Not Found", { status: resolved.status });
  }

  const { filePath, stats } = resolved;
  const { etag, lastModified, cacheControl } = buildHeaders(stats);
  const mime = getMimeType(filePath);

  return new NextResponse(null, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stats.size),
      "Cache-Control": cacheControl,
      ETag: etag,
      "Last-Modified": lastModified,
    },
  });
}
