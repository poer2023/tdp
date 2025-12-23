import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache tag for hero images invalidation
export const HERO_IMAGES_TAG = "hero-images";

/**
 * 获取激活的 Hero 图片 URL 列表（内部实现）
 */
async function _listHeroImages(): Promise<string[]> {
  const images = await prisma.heroImage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // Convert small thumbnails to medium resolution for better quality
  return images.map((img) => {
    // Replace _small.webp with _medium.webp for higher quality
    if (img.url.includes("_small.webp")) {
      return img.url.replace("_small.webp", "_medium.webp");
    }
    return img.url;
  });
}

/**
 * 获取激活的 Hero 图片 URL 列表
 * 用于首页 Hero 组件展示
 * Cached for 60s with hero-images tag
 */
export const listHeroImages = unstable_cache(
  _listHeroImages,
  ["hero-images-list"],
  { revalidate: 60, tags: [HERO_IMAGES_TAG] }
);

