import exifr from "exifr";

export interface ExifData {
  latitude?: number;
  longitude?: number;
  capturedAt?: Date;
  width?: number;
  height?: number;
  make?: string;
  model?: string;
}

export async function extractExif(buffer: Buffer): Promise<ExifData | null> {
  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      exif: true,
      tiff: true,
    });

    if (!exif) return null;

    const result: ExifData = {};

    if (exif.latitude !== undefined) result.latitude = exif.latitude;
    if (exif.longitude !== undefined) result.longitude = exif.longitude;
    if (exif.DateTimeOriginal) result.capturedAt = new Date(exif.DateTimeOriginal);
    if (exif.ImageWidth || exif.ExifImageWidth)
      result.width = exif.ImageWidth || exif.ExifImageWidth;
    if (exif.ImageHeight || exif.ExifImageHeight)
      result.height = exif.ImageHeight || exif.ExifImageHeight;
    if (exif.Make) result.make = exif.Make;
    if (exif.Model) result.model = exif.Model;

    return result;
  } catch (error) {
    console.error("EXIF extraction failed:", error);
    return null;
  }
}
