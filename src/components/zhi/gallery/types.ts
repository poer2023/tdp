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

// Thumbnail dimensions constants (must match thumbnail-item.tsx CSS)
export const THUMB_FULL_WIDTH = 60;       // active: w-[60px]
export const THUMB_COLLAPSED_WIDTH = 32;   // inactive: w-8 = 32px
export const THUMB_GAP = 4;
export const THUMB_MARGIN = 2;

export const GRID_IMAGE_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px";
