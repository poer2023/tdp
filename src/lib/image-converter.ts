import sharp from "sharp";

/**
 * HEIC/HEIF 图片转换工具
 * 基于 2025 最佳实践，使用 Sharp 进行服务器端转换
 */

export interface ConversionResult {
  buffer: Buffer;
  format: string;
  width?: number;
  height?: number;
  size: number;
}

export interface ConversionOptions {
  quality?: number; // JPEG 质量 (1-100)
  maxWidth?: number; // 最大宽度（保持宽高比）
  maxHeight?: number; // 最大高度（保持宽高比）
  keepMetadata?: boolean; // 保留 EXIF 元数据
}

const DEFAULT_OPTIONS: ConversionOptions = {
  quality: 90,
  keepMetadata: true,
};

/**
 * 检查文件是否为 HEIC/HEIF 格式
 */
export function isHEIC(buffer: Buffer, filename?: string): boolean {
  // 检查文件头魔术字节
  const heicSignature = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
  const hasHeicSignature = buffer.subarray(0, 8).equals(heicSignature.subarray(0, 4));

  // 检查文件扩展名
  const hasHeicExtension =
    filename &&
    (filename.toLowerCase().endsWith(".heic") || filename.toLowerCase().endsWith(".heif"));

  return hasHeicSignature || !!hasHeicExtension;
}

/**
 * 将 HEIC/HEIF 转换为 JPEG
 * @param buffer - 原始图片 Buffer
 * @param options - 转换选项
 * @returns 转换后的 JPEG Buffer 和元数据
 */
export async function convertHEICToJPEG(
  buffer: Buffer,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let pipeline = sharp(buffer, {
      // 确保可以读取 HEIF 格式
      failOnError: false,
    }).rotate(); // Auto-apply EXIF orientation

    // 提取元数据 (after rotation to get correct dimensions)
    const metadata = await pipeline.metadata();

    // 调整大小（如果指定）
    if (opts.maxWidth || opts.maxHeight) {
      pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // 转换为 JPEG
    pipeline = pipeline.jpeg({
      quality: opts.quality,
      mozjpeg: true, // 使用 mozjpeg 获得更好的压缩
    });

    // 保留元数据（让 Sharp 自动处理）
    if (opts.keepMetadata && metadata.exif) {
      pipeline = pipeline.withMetadata();
    }

    const outputBuffer = await pipeline.toBuffer();
    const info = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      format: "jpeg",
      width: info.width,
      height: info.height,
      size: outputBuffer.length,
    };
  } catch (error) {
    console.error("HEIC conversion failed:", error);
    throw new Error(`无法转换 HEIC 图片: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 智能图片处理：自动检测并转换 HEIC，或直接返回其他格式
 * @param buffer - 图片 Buffer
 * @param filename - 文件名
 * @param options - 转换选项
 * @returns 处理后的图片数据
 */
export async function processImage(
  buffer: Buffer,
  filename: string,
  options: ConversionOptions = {}
): Promise<ConversionResult & { converted: boolean; originalFormat?: string }> {
  // 检查是否为 HEIC
  if (isHEIC(buffer, filename)) {
    console.log(`检测到 HEIC 格式图片: ${filename}，开始转换...`);
    const result = await convertHEICToJPEG(buffer, options);
    return {
      ...result,
      converted: true,
      originalFormat: "heic",
    };
  }

  // 非 HEIC 格式，直接返回
  const metadata = await sharp(buffer).metadata();
  return {
    buffer,
    format: metadata.format || "unknown",
    width: metadata.width,
    height: metadata.height,
    size: buffer.length,
    converted: false,
  };
}

/**
 * 批量处理图片
 * @param files - 文件数组 [{buffer, filename}, ...]
 * @param options - 转换选项
 * @returns 处理结果数组
 */
export async function processImageBatch(
  files: Array<{ buffer: Buffer; filename: string }>,
  options: ConversionOptions = {}
): Promise<Array<ConversionResult & { filename: string; converted: boolean }>> {
  return Promise.all(
    files.map(async ({ buffer, filename }) => {
      const result = await processImage(buffer, filename, options);
      return {
        ...result,
        filename,
      };
    })
  );
}
