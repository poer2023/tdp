// Gallery component types

export type OriginalLoadState = {
    status: "idle" | "loading" | "success" | "error";
    loadedBytes: number;
    totalBytes: number | null;
};

export interface ZhiGalleryItem {
    id: string;
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title: string;
    description?: string;
    date: string;
    location?: string;
    exif?: {
        camera?: string;
        lens?: string;
        aperture?: string;
        iso?: string;
        shutter?: string;
    };
    width?: number;
    height?: number;
    // Extended fields for enhanced lightbox
    mediumPath?: string;
    smallThumbPath?: string;
    microThumbPath?: string;
    blurDataURL?: string;
    fileSize?: number;
    mimeType?: string;
    capturedAt?: string;
    createdAt?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    locationName?: string;
    isLivePhoto?: boolean;
    livePhotoVideoPath?: string;
    storageType?: string;
}

export interface ZhiGalleryProps {
    items: ZhiGalleryItem[];
}

// Thumbnail dimensions constants
export const THUMB_FULL_WIDTH = 120;
export const THUMB_COLLAPSED_WIDTH = 35;
export const THUMB_GAP = 2;
export const THUMB_MARGIN = 2;

export const GRID_IMAGE_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px";
