import prisma from "@/lib/prisma";
import { unstable_cache, revalidateTag } from "next/cache";
import { withDbFallback } from "@/lib/utils/db-fallback";

// Cache tag for curated items invalidation
export const CURATED_ITEMS_TAG = "curated-items";

/**
 * Curated item structure returned by listCuratedItems
 */
export interface CuratedItem {
    id: string;
    title: string;
    description: string | null;
    url: string;
    domain: string | null;
    imageUrl: string | null;
    tags: string[];
    likes: number;
    createdAt: Date;
}

/**
 * 获取分享项目列表（内部实现）
 */
async function _listCuratedItems(limit: number = 12): Promise<CuratedItem[]> {
    return withDbFallback(
        async () => {
            const items = await prisma.shareItem.findMany({
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            return items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                url: item.url,
                domain: item.domain,
                imageUrl: item.imageUrl,
                tags: item.tags || [],
                likes: item.likes,
                createdAt: item.createdAt,
            }));
        },
        async () => [],
        "curated:list"
    );
}

/**
 * 获取分享项目列表
 * 用于首页 curated items 展示
 * Cached for 60s with curated-items tag
 */
export const listCuratedItems = unstable_cache(
    _listCuratedItems,
    ["curated-items-list"],
    { revalidate: 60, tags: [CURATED_ITEMS_TAG] }
);

/**
 * 获取单个分享项目（内部实现）
 */
async function _getCuratedItemById(id: string): Promise<CuratedItem | null> {
    return withDbFallback(
        async () => {
            const item = await prisma.shareItem.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    domain: true,
                    imageUrl: true,
                    tags: true,
                    likes: true,
                    createdAt: true,
                },
            });
            if (!item) return null;
            return {
                id: item.id,
                title: item.title,
                description: item.description,
                url: item.url,
                domain: item.domain,
                imageUrl: item.imageUrl,
                tags: item.tags || [],
                likes: item.likes,
                createdAt: item.createdAt,
            };
        },
        async () => null,
        "curated:detail"
    );
}

/**
 * 获取单个分享项目（缓存版本）
 */
export const getCuratedItemById = unstable_cache(
    _getCuratedItemById,
    ["curated-item-detail"],
    { revalidate: 60, tags: [CURATED_ITEMS_TAG] }
);

/**
 * 获取相关分享项目（内部实现）
 */
async function _getRelatedCuratedItems(id: string, tags: string[], limit: number = 4): Promise<CuratedItem[]> {
    return withDbFallback(
        async () => {
            // Get items with matching tags first
            const relatedItems = await prisma.shareItem.findMany({
                where: {
                    id: { not: id },
                    ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    domain: true,
                    imageUrl: true,
                    tags: true,
                    likes: true,
                    createdAt: true,
                },
            });

            // If not enough, fill with recent ones
            if (relatedItems.length < limit) {
                const recentItems = await prisma.shareItem.findMany({
                    where: {
                        id: { notIn: [id, ...relatedItems.map((r) => r.id)] },
                    },
                    orderBy: { createdAt: "desc" },
                    take: limit - relatedItems.length,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        url: true,
                        domain: true,
                        imageUrl: true,
                        tags: true,
                        likes: true,
                        createdAt: true,
                    },
                });
                relatedItems.push(...recentItems);
            }

            return relatedItems.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                url: item.url,
                domain: item.domain,
                imageUrl: item.imageUrl,
                tags: item.tags || [],
                likes: item.likes,
                createdAt: item.createdAt,
            }));
        },
        async () => [],
        "curated:related"
    );
}

/**
 * 获取相关分享项目（缓存版本）
 */
export const getRelatedCuratedItems = unstable_cache(
    _getRelatedCuratedItems,
    ["curated-items-related"],
    { revalidate: 60, tags: [CURATED_ITEMS_TAG] }
);

/**
 * 触发缓存失效
 */
export function invalidateCuratedCache() {
    revalidateTag(CURATED_ITEMS_TAG, "max");
}
