import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import mime from "mime-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads") + path.sep;
    const filePath = path.resolve(uploadsDir, ...params.path);

    // 安全检查：防止路径遍历攻击
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 检查文件是否存在
    let stats;
    try {
      stats = await stat(filePath);
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (!stats.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 生成 ETag（基于文件大小和修改时间）
    const etag = `"${stats.size}-${stats.mtimeMs}"`;
    const lastModified = stats.mtime.toUTCString();

    // 处理条件请求（304 Not Modified）
    const ifNoneMatch = request.headers.get("if-none-match");
    const ifModifiedSince = request.headers.get("if-modified-since");

    if (
      ifNoneMatch === etag ||
      (ifModifiedSince &&
        Math.floor(new Date(ifModifiedSince).getTime() / 1000) >=
          Math.floor(stats.mtime.getTime() / 1000))
    ) {
      return new NextResponse(null, { status: 304 });
    }

    // 读取文件内容
    const buffer = await readFile(filePath);

    // 确定 MIME 类型
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    // 返回文件内容并设置缓存头
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads") + path.sep;
    const filePath = path.resolve(uploadsDir, ...params.path);

    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse(null, { status: 403 });
    }

    let stats;
    try {
      stats = await stat(filePath);
    } catch {
      return new NextResponse(null, { status: 404 });
    }

    if (!stats.isFile()) {
      return new NextResponse(null, { status: 404 });
    }

    const etag = `"${stats.size}-${stats.mtimeMs}"`;
    const lastModified = stats.mtime.toUTCString();
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    });
  } catch (error) {
    console.error("Error in HEAD request:", error);
    return new NextResponse(null, { status: 500 });
  }
}
