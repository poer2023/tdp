// Gallery translations

export type GalleryTranslations = {
    Gallery: string;
    Type: string;
    Video: string;
    Location: string;
    Camera: string;
    Lens: string;
    Aperture: string;
    ISO: string;
    Shutter: string;
    FileInfo: string;
    TimeInfo: string;
    Filename: string;
    Size: string;
    Resolution: string;
    Format: string;
    Captured: string;
    Uploaded: string;
    Loading: string;
    LivePhoto: string;
    LivePhotoHint: string;
};

const translations: Record<string, GalleryTranslations> = {
    en: {
        Gallery: "Gallery",
        Type: "Type",
        Video: "Video",
        Location: "Location",
        Camera: "Camera",
        Lens: "Lens",
        Aperture: "Aperture",
        ISO: "ISO",
        Shutter: "Shutter",
        FileInfo: "File Info",
        TimeInfo: "Time",
        Filename: "Filename",
        Size: "Size",
        Resolution: "Resolution",
        Format: "Format",
        Captured: "Captured",
        Uploaded: "Uploaded",
        Loading: "Loading image",
        LivePhoto: "Live Photo",
        LivePhotoHint: "This photo contains live video content.",
    },
    zh: {
        Gallery: "相册",
        Type: "类型",
        Video: "视频",
        Location: "位置",
        Camera: "相机",
        Lens: "镜头",
        Aperture: "光圈",
        ISO: "感光度",
        Shutter: "快门",
        FileInfo: "文件信息",
        TimeInfo: "时间信息",
        Filename: "文件名",
        Size: "文件大小",
        Resolution: "分辨率",
        Format: "格式",
        Captured: "拍摄时间",
        Uploaded: "上传时间",
        Loading: "正在加载图片",
        LivePhoto: "实况照片",
        LivePhotoHint: "此照片包含动态视频内容。",
    },
};

export function getGalleryTranslation(locale: string, key: keyof GalleryTranslations): string {
    // translations.en is always defined since it's a const object literal
    return translations[locale]?.[key] ?? translations.en![key] ?? key;
}
