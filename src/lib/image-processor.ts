import sharp from "sharp";

export type ThumbnailSizes = {
  micro: Buffer;
  small: Buffer;
  medium: Buffer;
};

export type ThumbnailConfig = {
  micro: number;
  small: number;
  medium: number;
  quality: number;
};

const DEFAULT_CONFIG: ThumbnailConfig = {
  micro: 64,
  small: 480,
  medium: 1200,
  quality: 85,
};

/**
 * Generate multiple thumbnail sizes from an image buffer
 * @param imageBuffer - Original image buffer
 * @param config - Optional thumbnail configuration
 * @returns Object containing micro, small, and medium thumbnail buffers
 */
export async function generateThumbnails(
  imageBuffer: Buffer,
  config: Partial<ThumbnailConfig> = {}
): Promise<ThumbnailSizes> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Process all sizes in parallel for performance
  // Note: .rotate() auto-applies EXIF orientation metadata
  const [micro, small, medium] = await Promise.all([
    // Micro: 64x64 for film strip
    sharp(imageBuffer)
      .rotate() // Auto-apply EXIF orientation
      .resize(cfg.micro, cfg.micro, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: cfg.quality })
      .toBuffer(),

    // Small: 480px width for gallery masonry
    sharp(imageBuffer)
      .rotate() // Auto-apply EXIF orientation
      .resize(cfg.small, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: cfg.quality })
      .toBuffer(),

    // Medium: 1200px width for detail viewer
    sharp(imageBuffer)
      .rotate() // Auto-apply EXIF orientation
      .resize(cfg.medium, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: cfg.quality })
      .toBuffer(),
  ]);

  return { micro, small, medium };
}

/**
 * Get file extension for thumbnail based on size
 * @param size - Thumbnail size name
 * @returns File extension with suffix
 */
export function getThumbnailExtension(size: keyof ThumbnailSizes): string {
  return `_${size}.webp`;
}

/**
 * Generate thumbnail filename from original filename
 * @param originalFilename - Original file name (e.g., "abc123.jpg")
 * @param size - Thumbnail size name
 * @returns Thumbnail filename (e.g., "abc123_small.webp")
 */
export function getThumbnailFilename(originalFilename: string, size: keyof ThumbnailSizes): string {
  const nameWithoutExt = originalFilename.replace(/\.[^.]+$/, "");
  return `${nameWithoutExt}${getThumbnailExtension(size)}`;
}

/**
 * Generate a blur data URL for image placeholder (LQIP)
 * Creates a tiny ~20px blurred image encoded as Base64
 * Result is ~500-1500 bytes, suitable for inline embedding
 * 
 * @param imageBuffer - Original image buffer
 * @returns Base64 data URL string (e.g., "data:image/webp;base64,...")
 */
export async function generateBlurDataURL(imageBuffer: Buffer): Promise<string> {
  const blurBuffer = await sharp(imageBuffer)
    .rotate() // Auto-apply EXIF orientation
    .resize(20, 20, { fit: "inside" })
    .blur(2)
    .webp({ quality: 50 })
    .toBuffer();

  return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
}
