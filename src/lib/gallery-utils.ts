import type { GalleryImage } from "@/lib/gallery";

/**
 * Gallery item data structure for UI components
 */
export interface GalleryItemData {
  id: string;
  src: string;
  alt: string;
  title: string;
  span: string;
  width?: number | null;
  height?: number | null;
}

/**
 * Convert GalleryImage from database to GalleryItemData for UI components
 *
 * This function can be called from server components (no "use client" needed)
 *
 * Features:
 * - Prioritizes thumbnail paths for better performance
 * - Automatically determines column span based on aspect ratio
 * - Wide images (aspect ratio > 1.5) span 2 columns on small+ screens
 *
 * @param image - GalleryImage from database
 * @returns GalleryItemData for UI rendering
 */
export function convertGalleryImageToItemData(
  image: GalleryImage
): GalleryItemData {
  // Prioritize thumbnail paths for better performance
  const src = image.mediumPath || image.smallThumbPath || image.filePath;

  // Calculate if image is wide (aspect ratio > 1.5)
  const isWide =
    image.width && image.height && image.width / image.height > 1.5;

  // Wide images span 2 columns on small+ screens
  const span = isWide ? "sm:col-span-2" : "col-span-1";

  return {
    id: image.id,
    src,
    alt: image.description || image.title || "Gallery image",
    title: image.title || "Untitled",
    span,
    width: image.width,
    height: image.height,
  };
}
