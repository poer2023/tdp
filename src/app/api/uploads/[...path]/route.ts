import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";

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
    baseEtag: etag,
    lastModified: stats.mtime.toUTCString(),
    cacheControl: "public, max-age=31536000, immutable",
  };
}

type ResolveResult =
  | { status: 403 | 404 }
  | { status: 200; filePath: string; stats: { size: number; mtime: Date }; dynamicTransform?: TransformOptions };

async function resolveFile(request: NextRequest, params: string[]): Promise<ResolveResult> {
  void request;
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads") + path.sep;
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
    // If file not found, check if it's a webp thumbnail request
    // and try to find the original image for dynamic conversion
    const fileName = params[params.length - 1] || "";
    const thumbMatch = fileName.match(/^(.+)_(micro|small|medium)\.webp$/);

    if (thumbMatch) {
      const baseName = thumbMatch[1];
      const thumbSize = thumbMatch[2] as "micro" | "small" | "medium";

      // Try to find original image with common extensions
      const extensions = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
      for (const ext of extensions) {
        const originalParams = [...params.slice(0, -1), `${baseName}${ext}`];
        const originalPath = path.resolve(uploadsRoot, ...originalParams);

        // Security check: prevent path traversal attacks
        // Ensure the resolved path stays within uploadsRoot
        if (!originalPath.startsWith(uploadsRoot)) {
          continue;
        }

        try {
          const originalStats = await stat(originalPath);
          if (originalStats.isFile()) {
            // Determine resize dimensions based on thumbnail size
            const dimensions: Record<string, { width?: number; height?: number }> = {
              micro: { width: 64, height: 64 },
              small: { width: 480 },
              medium: { width: 1200 },
            };

            return {
              status: 200 as const,
              filePath: originalPath,
              stats: originalStats,
              dynamicTransform: {
                ...dimensions[thumbSize],
                format: "webp",
                quality: 85,
              },
            };
          }
        } catch {
          // Continue to next extension
        }
      }
    }

    return { status: 404 as const };
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { path: pathSegments } = await params;
  const response = await serveFile(request, pathSegments);
  if (response instanceof NextResponse) {
    return response;
  }
  return response.toResponse();
}

export async function HEAD(request: NextRequest, { params }: Params) {
  const { path: pathSegments } = await params;
  const response = await serveFile(request, pathSegments, { headOnly: true });
  if (response instanceof NextResponse) {
    return response;
  }
  return response.toResponse();
}

type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
};

type ServeFileResult =
  | NextResponse
  | {
      toResponse: () => NextResponse;
    };

function parseTransformOptions(url: URL): TransformOptions {
  const width = Number.parseInt(url.searchParams.get("w") ?? "", 10);
  const height = Number.parseInt(url.searchParams.get("h") ?? "", 10);
  const quality = Number.parseInt(url.searchParams.get("q") ?? "", 10);
  const formatParam = url.searchParams.get("format") ?? url.searchParams.get("fm");
  const format =
    formatParam && ["webp", "jpeg", "png", "avif"].includes(formatParam.toLowerCase())
      ? (formatParam.toLowerCase() as TransformOptions["format"])
      : undefined;

  const toPositive = (value: number) => (Number.isFinite(value) && value > 0 ? value : undefined);

  return {
    width: toPositive(width),
    height: toPositive(height),
    quality: toPositive(quality),
    format,
  };
}

function shouldTransform(mime: string, options: TransformOptions): boolean {
  if (!mime.startsWith("image/")) return false;
  if (mime === "image/svg+xml") return false;
  if (mime === "image/gif") return false; // avoid breaking animation
  return Boolean(options.width || options.height || options.quality || options.format);
}

async function applyTransform(
  buffer: Buffer,
  mime: string,
  options: TransformOptions
): Promise<{ buffer: Buffer; mime: string }> {
  const qual = options.quality && options.quality <= 100 ? options.quality : undefined;
  let pipeline = sharp(buffer, { failOnError: false });

  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const targetFormat =
    options.format ??
    (mime !== "image/webp" && mime !== "image/avif" && (options.width || options.height || qual)
      ? "webp"
      : undefined);

  if (targetFormat === "webp") {
    pipeline = pipeline.webp({ quality: qual ?? 78 });
    return { buffer: await pipeline.toBuffer(), mime: "image/webp" };
  }

  if (targetFormat === "jpeg") {
    pipeline = pipeline.jpeg({ quality: qual ?? 82, mozjpeg: true });
    return { buffer: await pipeline.toBuffer(), mime: "image/jpeg" };
  }

  if (targetFormat === "png") {
    pipeline = pipeline.png({ quality: qual ?? 80 });
    return { buffer: await pipeline.toBuffer(), mime: "image/png" };
  }

  if (targetFormat === "avif") {
    pipeline = pipeline.avif({ quality: qual ?? 60 });
    return { buffer: await pipeline.toBuffer(), mime: "image/avif" };
  }

  if (qual && !targetFormat) {
    // Adjust quality without format change (e.g., jpeg input)
    if (mime === "image/jpeg") {
      pipeline = pipeline.jpeg({ quality: qual, mozjpeg: true });
      return { buffer: await pipeline.toBuffer(), mime };
    }
    if (mime === "image/png") {
      pipeline = pipeline.png({ quality: qual });
      return { buffer: await pipeline.toBuffer(), mime };
    }
  }

  return { buffer: await pipeline.toBuffer(), mime };
}

async function serveFile(
  request: NextRequest,
  pathSegments: string[],
  opts: { headOnly?: boolean } = {}
): Promise<ServeFileResult> {
  const resolved = await resolveFile(request, pathSegments);
  if (resolved.status !== 200) {
    return new NextResponse("Not Found", { status: resolved.status });
  }

  const { filePath, stats, dynamicTransform } = resolved;
  const { baseEtag, lastModified, cacheControl } = buildHeaders(stats);
  const url = new URL(request.url);
  // Merge dynamic transform options with URL query params (URL params take precedence)
  const urlOptions = parseTransformOptions(url);
  const transformOptions: TransformOptions = {
    ...dynamicTransform,
    ...Object.fromEntries(
      Object.entries(urlOptions).filter(([, v]) => v !== undefined)
    ),
  };
  const mime = getMimeType(filePath);
  const shouldApplyTransform = shouldTransform(mime, transformOptions) || !!dynamicTransform;
  const etagSuffix = shouldApplyTransform
    ? `-opt-${transformOptions.width ?? ""}-${transformOptions.height ?? ""}-${transformOptions.format ?? "auto"}-${transformOptions.quality ?? ""}`
    : "";
  const finalEtag = `${baseEtag.slice(0, -1)}${etagSuffix}"`;

  const inm = request.headers.get("if-none-match");
  if (inm && inm === finalEtag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: finalEtag,
        "Last-Modified": lastModified,
        "Cache-Control": cacheControl,
      },
    });
  }

  const ims = request.headers.get("if-modified-since");
  if (ims) {
    const since = Date.parse(ims);
    if (
      !Number.isNaN(since) &&
      Math.floor(stats.mtime.getTime() / 1000) <= Math.floor(since / 1000) &&
      !shouldApplyTransform
    ) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: finalEtag,
          "Last-Modified": lastModified,
          "Cache-Control": cacheControl,
        },
      });
    }
  }

  const originalBuffer = await readFile(filePath);

  const { buffer, responseMime } = shouldApplyTransform
    ? await applyTransform(originalBuffer, mime, transformOptions).then((result) => ({
        buffer: result.buffer,
        responseMime: result.mime,
      }))
    : { buffer: originalBuffer, responseMime: mime };

  const uint8 = new Uint8Array(buffer);
  const baseHeaders = {
    "Content-Type": responseMime,
    "Content-Length": String(uint8.byteLength),
    "Cache-Control": cacheControl,
    ETag: finalEtag,
    "Last-Modified": lastModified,
  };

  if (opts.headOnly) {
    return {
      toResponse: () =>
        new NextResponse(null, {
          headers: baseHeaders,
        }),
    };
  }

  return {
    toResponse: () =>
      new NextResponse(uint8, {
        headers: baseHeaders,
      }),
  };
}
