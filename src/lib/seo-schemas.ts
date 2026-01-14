import type { ZhiProfile } from "./zhi-profile";

/**
 * SEO Schema generators for structured data (JSON-LD)
 * Follows schema.org specifications for rich search results
 */

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

/**
 * Generate WebSite schema for homepage
 * Enables search engine to understand the site structure and enable sitelinks search box
 */
export function generateWebSiteSchema(locale: "en" | "zh") {
    const siteUrl = getSiteUrl();
    const localePrefix = locale === "zh" ? "/zh" : "";

    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ZHI·Soft Hours",
        url: `${siteUrl}${localePrefix}`,
        description:
            locale === "zh"
                ? "个人博客、生活分享与作品集"
                : "Personal Blog, Life Sharing & Portfolio",
        inLanguage: locale === "zh" ? "zh-CN" : "en-US",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteUrl}${localePrefix}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

/**
 * Generate Person schema for the site owner
 * Helps search engines connect content to the author
 */
export function generatePersonSchema(profile: ZhiProfile, socialLinks?: string[]) {
    const siteUrl = getSiteUrl();

    return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        url: siteUrl,
        jobTitle: profile.title,
        description: profile.bio,
        image: profile.avatarUrl ? `${siteUrl}${profile.avatarUrl}` : undefined,
        sameAs: socialLinks || [],
    };
}

/**
 * Generate ImageGallery schema for gallery pages
 * Improves visibility in Google Images search
 */
export function generateImageGallerySchema(
    locale: "en" | "zh",
    imageCount: number,
    featuredImages?: Array<{
        url: string;
        title?: string;
        width?: number;
        height?: number;
    }>
) {
    const siteUrl = getSiteUrl();
    const localePrefix = locale === "zh" ? "/zh" : "";

    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        name: locale === "zh" ? "相册" : "Gallery",
        description:
            locale === "zh"
                ? "精选照片集 - 生活、旅行与创意摄影"
                : "Curated Photo Collection - Life, Travel & Creative Photography",
        url: `${siteUrl}${localePrefix}/gallery`,
        numberOfItems: imageCount,
        inLanguage: locale === "zh" ? "zh-CN" : "en-US",
    };

    // Add featured images if provided (Google recommends including representative images)
    if (featuredImages && featuredImages.length > 0) {
        schema.image = featuredImages.slice(0, 5).map((img) => ({
            "@type": "ImageObject",
            url: img.url.startsWith("http") ? img.url : `${siteUrl}${img.url}`,
            name: img.title,
            width: img.width,
            height: img.height,
        }));
    }

    return schema;
}

/**
 * Generate Organization schema for the publisher
 * Used in BlogPosting and other content schemas
 */
export function generateOrganizationSchema() {
    const siteUrl = getSiteUrl();

    return {
        "@type": "Organization",
        name: "ZHI·Soft Hours",
        url: siteUrl,
        logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/icon-512.png`,
        },
    };
}
