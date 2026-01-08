import type { GalleryImage } from "@/lib/gallery";

export type PhotoViewerProps = {
    image: GalleryImage;
    prevId: string | null;
    nextId: string | null;
    prevPath?: string;
    nextPath?: string;
    locale?: "zh" | "en";
    thumbnails?: {
        id: string;
        filePath: string;
        microThumbPath?: string | null;
        smallThumbPath?: string | null;
        mediumPath?: string | null;
    }[];
    currentId?: string;
};

export type OriginalLoadState = {
    status: "idle" | "loading" | "success" | "error";
    loadedBytes: number;
    totalBytes: number | null;
};

export type SlideContext = {
    direction: "left" | "right";
    fromSrc: string;
    fromAlt: string;
    phase: "pre" | "animating";
};

export type DragState = {
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
};

export const SLIDE_STORAGE_KEY = "gallery-slide-direction";
