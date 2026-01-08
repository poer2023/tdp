import type { GalleryImage } from "@/lib/gallery";

export type PhotoViewerProps = {
    image: GalleryImage;
    prevId: string | null;
    nextId: string | null;
    prevPath?: string;
    nextPath?: string;
    locale?: "zh" | "en";
    thumbnails?: ThumbnailItem[];
    currentId?: string;
};

export type ThumbnailItem = {
    id: string;
    filePath: string;
    microThumbPath?: string | null;
    smallThumbPath?: string | null;
    mediumPath?: string | null;
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

export type Offset = { x: number; y: number };
export type Size = { w: number; h: number };

// ─────────────────────────────────────────────────────────────────────────────
// Hook Return Types
// ─────────────────────────────────────────────────────────────────────────────

export type UsePhotoZoomReturn = {
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    offset: Offset;
    setOffset: React.Dispatch<React.SetStateAction<Offset>>;
    showZoomIndicator: boolean;
    showHint: boolean;
    setShowHint: (v: boolean) => void;
    clampOffset: (nextOffset: Offset, s: number) => Offset;
    containerSize: Size;
    naturalSize: Size | null;
    setNaturalSize: (size: Size | null) => void;
    imgWrapRef: React.RefObject<HTMLDivElement | null>;
};

export type UsePhotoDragReturn = {
    isDragging: boolean;
    dragRef: React.MutableRefObject<DragState>;
};

export type UseImageLoadingReturn = {
    displaySrc: string;
    setDisplaySrc: (src: string) => void;
    originalState: OriginalLoadState;
    showProgress: boolean;
};

export type UseSlideAnimationReturn = {
    slideContext: SlideContext | null;
    startSlide: (direction: "left" | "right", from: { src: string; alt: string }) => void;
    markPendingDirection: (direction: "prev" | "next") => void;
    clearStoredDirection: () => void;
    pendingDirectionRef: React.MutableRefObject<"prev" | "next" | null>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

export type PhotoViewerToolbarProps = {
    locale: "zh" | "en";
    backButtonRef?: React.RefObject<HTMLAnchorElement | null>;
};

export type PhotoViewerNavigationProps = {
    locale: "zh" | "en";
    prevId: string | null;
    nextId: string | null;
    onPrevClick?: () => void;
    onNextClick?: () => void;
};

export type PhotoViewerImageProps = {
    locale: "zh" | "en";
    displaySrc: string;
    title?: string | null;
    scale: number;
    offset: Offset;
    isDragging: boolean;
    showZoomIndicator: boolean;
    showHint: boolean;
    slideContext: SlideContext | null;
    imgWrapRef: React.RefObject<HTMLDivElement | null>;
    onNaturalSizeChange: (size: Size) => void;
};

export type LoadingProgressProps = {
    locale: "zh" | "en";
    loadedBytes: number;
    totalBytes: number | null;
};

export const SLIDE_STORAGE_KEY = "gallery-slide-direction";

