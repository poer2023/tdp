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
  return images.map((img) => img.url);
}
