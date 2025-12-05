import prisma from "@/lib/prisma";

/**
 * 获取激活的 Hero 图片 URL 列表
 * 用于首页 Hero 组件展示
 */
export async function listHeroImages(): Promise<string[]> {
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
