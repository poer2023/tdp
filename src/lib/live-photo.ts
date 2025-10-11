import exifr from "exifr";

export interface LivePhotoFiles {
  image: File | null;
  video?: File;
}

export interface LivePhotoMetadata {
  isLivePhoto: boolean;
  contentIdentifier?: string;
  assetIdentifier?: string;
  hasPairedVideo: boolean;
}

export function detectLivePhoto(files: File[]): LivePhotoFiles {
  // 按文件名配对（iOS 导出时同名）
  const imageFile = files.find(
    (f) => f.type.startsWith("image/") || f.name.match(/\.(heic|heif|jpg|jpeg|png)$/i)
  );

  const videoFile = files.find((f) => f.type.startsWith("video/") || f.name.match(/\.(mov|mp4)$/i));

  // 检查是否为配对的 Live Photo（文件名相同，扩展名不同）
  if (imageFile && videoFile) {
    const imageName = imageFile.name.replace(/\.[^.]+$/, "");
    const videoName = videoFile.name.replace(/\.[^.]+$/, "");

    if (imageName === videoName) {
      return { image: imageFile, video: videoFile };
    }
  }

  return { image: imageFile || files[0] || null };
}

export function isHEIC(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

/**
 * 从图片 Buffer 中检测 Live Photo 元数据
 * 根据 2025 最佳实践，检测 Apple MakerNotes 中的 ContentIdentifier (key 17)
 */
export async function detectLivePhotoMetadata(buffer: Buffer): Promise<LivePhotoMetadata> {
  try {
    const exif = await exifr.parse(buffer, {
      makerNote: true, // 启用 Apple MakerNotes 解析
      tiff: true,
      exif: true,
      gps: false, // 不需要 GPS 数据
      translateKeys: false, // 保持原始键名
      translateValues: false,
    });

    if (!exif) {
      return {
        isLivePhoto: false,
        hasPairedVideo: false,
      };
    }

    // 检查 Apple MakerNotes 中的 Live Photo 标识
    // ContentIdentifier 在 Apple MakerNotes 中的 key 为 17
    // 也可能在 Apple:ContentIdentifier 或 MakerNote 字段中
    const contentIdentifier =
      exif["17"] || // Apple MakerNotes key 17
      exif.ContentIdentifier ||
      exif["Apple:ContentIdentifier"] ||
      exif.MakerNote?.ContentIdentifier ||
      null;

    // 检查 Asset Identifier (Live Photo 的唯一标识)
    const assetIdentifier =
      exif.AssetIdentifier ||
      exif["Apple:AssetIdentifier"] ||
      exif.MakerNote?.AssetIdentifier ||
      null;

    // 如果有 ContentIdentifier 或 AssetIdentifier，则可能是 Live Photo
    const isLivePhoto = !!(contentIdentifier || assetIdentifier);

    return {
      isLivePhoto,
      contentIdentifier: contentIdentifier || undefined,
      assetIdentifier: assetIdentifier || undefined,
      hasPairedVideo: false, // 此时尚未检测到配对视频
    };
  } catch (error) {
    console.error("Failed to detect Live Photo metadata:", error);
    return {
      isLivePhoto: false,
      hasPairedVideo: false,
    };
  }
}

/**
 * 从 MOV 视频中提取 ContentIdentifier
 */
export async function extractVideoContentIdentifier(buffer: Buffer): Promise<string | null> {
  try {
    // 使用 exifr 提取 MOV 文件的元数据
    const exif = await exifr.parse(buffer, {
      translateKeys: false,
      translateValues: false,
    });

    if (!exif) return null;

    // QuickTime 视频中的 ContentIdentifier
    return (
      exif.ContentIdentifier ||
      exif["com.apple.quicktime.content.identifier"] ||
      exif["Apple:ContentIdentifier"] ||
      null
    );
  } catch (error) {
    console.error("Failed to extract video ContentIdentifier:", error);
    return null;
  }
}

/**
 * 验证图片和视频是否为配对的 Live Photo
 */
export async function verifyLivePhotoPair(
  imageBuffer: Buffer,
  videoBuffer: Buffer
): Promise<boolean> {
  try {
    const [imageMetadata, videoIdentifier] = await Promise.all([
      detectLivePhotoMetadata(imageBuffer),
      extractVideoContentIdentifier(videoBuffer),
    ]);

    // 如果都有 ContentIdentifier 且相同，则为配对的 Live Photo
    if (
      imageMetadata.contentIdentifier &&
      videoIdentifier &&
      imageMetadata.contentIdentifier === videoIdentifier
    ) {
      return true;
    }

    // 如果图片标记为 Live Photo 且有视频，也认为是配对的
    return imageMetadata.isLivePhoto;
  } catch (error) {
    console.error("Failed to verify Live Photo pair:", error);
    return false;
  }
}
