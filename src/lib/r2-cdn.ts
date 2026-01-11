/**
 * R2 CDN URL 转换工具
 * 将 R2 公共桶 URL 转换为自定义域名 URL
 */

// 匹配所有 R2 公共桶 URL 格式
const R2_PUBLIC_BUCKET_PATTERN = /^https:\/\/pub-[a-z0-9]+\.r2\.dev\//;
const R2_CDN_DOMAIN = process.env.NEXT_PUBLIC_R2_CDN_DOMAIN;

/**
 * 检查是否已配置 CDN 域名
 */
export function isR2CdnEnabled(): boolean {
    return !!R2_CDN_DOMAIN;
}

/**
 * 获取 CDN 域名（用于 preconnect）
 */
export function getR2CdnDomain(): string | undefined {
    return R2_CDN_DOMAIN;
}

/**
 * 将 R2 公共桶 URL 转换为 CDN URL
 * @example
 * toR2CdnUrl("https://pub-xxx.r2.dev/gallery/image.webp")
 * // => "https://img.dybzy.com/gallery/image.webp"
 */
export function toR2CdnUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    if (!R2_CDN_DOMAIN) return url; // 未配置时返回原 URL

    if (R2_PUBLIC_BUCKET_PATTERN.test(url)) {
        // 移除尾部斜杠以避免双斜杠
        const cdnBase = R2_CDN_DOMAIN.replace(/\/$/, '');
        return url.replace(R2_PUBLIC_BUCKET_PATTERN, `${cdnBase}/`);
    }

    return url;
}

/**
 * 批量转换 GalleryImage URL
 */
export function transformGalleryImageUrls<T extends {
    filePath?: string;
    mediumPath?: string | null;
    smallThumbPath?: string | null;
    microThumbPath?: string | null;
    livePhotoVideoPath?: string | null;
}>(image: T): T {
    return {
        ...image,
        filePath: toR2CdnUrl(image.filePath) ?? image.filePath,
        mediumPath: toR2CdnUrl(image.mediumPath),
        smallThumbPath: toR2CdnUrl(image.smallThumbPath),
        microThumbPath: toR2CdnUrl(image.microThumbPath),
        livePhotoVideoPath: toR2CdnUrl(image.livePhotoVideoPath),
    };
}

/**
 * 转换 Moment 图片 URL
 */
export function transformMomentImageUrls<T extends {
    url?: string;
    thumbnail?: string | null;
}>(image: T): T {
    return {
        ...image,
        url: toR2CdnUrl(image.url) ?? image.url,
        thumbnail: toR2CdnUrl(image.thumbnail),
    };
}
