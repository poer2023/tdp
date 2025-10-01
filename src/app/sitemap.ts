import { MetadataRoute } from "next";

/**
 * Root sitemap index that points to locale-specific sitemaps
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return [
    {
      url: `${baseUrl}/sitemap-en.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-zh.xml`,
      lastModified: new Date(),
    },
  ];
}
