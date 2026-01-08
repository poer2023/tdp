import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { withDbFallback } from "@/lib/utils/db-fallback";

// Cache tag for hero images invalidation
export const HERO_IMAGES_TAG = "hero-images";

const INTERNAL_HOST_HINTS = ["r2.dev", "r2.cloudflarestorage.com", "dybzy.com"];

function isLikelyInternalUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const host = new URL(url).hostname;
    return INTERNAL_HOST_HINTS.some((hint) => host.includes(hint));
  } catch {
    return false;
  }
}

function toHeroThumbUrl(url: string): string {
  const [rawPath, rawQuery] = url.split("?");
  const path = rawPath ?? "";
  const query = rawQuery ?? "";
  const isInternal = isLikelyInternalUrl(url);
  const isCover = path.includes("/covers/") || path.includes("covers/");

  if (path.includes("_small.webp")) return url;
  if (path.includes("_medium.webp") && isInternal && !isCover) {
    const replaced = path.replace("_medium.webp", "_small.webp");
    return query ? `${replaced}?${query}` : replaced;
  }

  if (isInternal && !isCover && /\.(jpe?g|png|webp|heic|heif)$/i.test(path)) {
    const replaced = `${path.replace(/\.[^.]+$/, "")}_small.webp`;
    return query ? `${replaced}?${query}` : replaced;
  }

  return url;
}

/**
 * 获取激活的 Hero 图片 URL 列表（内部实现）
 */
async function _listHeroImages(): Promise<string[]> {
  return withDbFallback(
    async () => {
      const images = await prisma.heroImage.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });

      // Prefer small thumbnails to keep hero grid lightweight
      return images.map((img) => toHeroThumbUrl(img.url));
    },
    async () => [],
    "hero:list"
  );
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
