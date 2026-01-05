import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getStorageConfigAsync } from "@/lib/storage/config";

/**
 * Image usage reference
 */
interface ImageReference {
    type: 'GalleryImage' | 'Post' | 'Moment' | 'HeroImage' | 'Project' | 'ShareItem' | 'Friend';
    id: string;
    title?: string;
    url: string;
}

/**
 * Usage result for a single image
 */
interface UsageResult {
    used: boolean;
    references: ImageReference[];
}

/**
 * Helper to normalize a storage key to possible URL patterns
 */
function getUrlPatterns(key: string, cdnUrl?: string, endpoint?: string, bucket?: string): string[] {
    const patterns: string[] = [key];

    // Add CDN URL pattern
    if (cdnUrl) {
        patterns.push(`${cdnUrl}/${key}`);
        // Also check with trailing slash variations
        const cleanCdnUrl = cdnUrl.replace(/\/$/, '');
        patterns.push(`${cleanCdnUrl}/${key}`);
    }

    // Add direct S3/R2 endpoint pattern
    if (endpoint && bucket) {
        patterns.push(`${endpoint}/${bucket}/${key}`);
    }

    // Add relative path patterns
    if (key.startsWith('gallery/')) {
        patterns.push(`/${key}`);
        patterns.push(`/uploads/${key}`);
    }

    return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Check if any of the patterns match the given value
 */
function matchesAnyPattern(value: string | null | undefined, patterns: string[]): boolean {
    if (!value) return false;
    return patterns.some(pattern => value.includes(pattern) || pattern.includes(value));
}

/**
 * POST /api/admin/storage/check-usage
 * Check image usage across all tables
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const keys: string[] = body.keys || [];

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: "Keys array is required" }, { status: 400 });
        }

        // Limit to prevent abuse
        if (keys.length > 200) {
            return NextResponse.json({ error: "Maximum 200 keys per request" }, { status: 400 });
        }

        // Get storage config for URL pattern matching
        const config = await getStorageConfigAsync();
        const { cdnUrl, endpoint, bucket } = config;

        // Build usage map
        const usageMap: Record<string, UsageResult> = {};

        // Prepare URL patterns for each key
        const keyPatterns = new Map<string, string[]>();
        for (const key of keys) {
            keyPatterns.set(key, getUrlPatterns(key, cdnUrl || undefined, endpoint || undefined, bucket || undefined));
            usageMap[key] = { used: false, references: [] };
        }

        // Get base key without extension for thumbnail matching
        const getBaseKey = (key: string) => key.replace(/_(micro|small|medium)\.webp$/i, '').replace(/\.[^.]+$/, '');

        // 1. Check GalleryImage table
        const galleryImages = await prisma.galleryImage.findMany({
            select: {
                id: true,
                title: true,
                filePath: true,
                microThumbPath: true,
                smallThumbPath: true,
                mediumPath: true,
            },
        });

        for (const img of galleryImages) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                const baseKey = getBaseKey(key);

                // Check main file and thumbnails
                if (
                    matchesAnyPattern(img.filePath, patterns) ||
                    matchesAnyPattern(img.microThumbPath, patterns) ||
                    matchesAnyPattern(img.smallThumbPath, patterns) ||
                    matchesAnyPattern(img.mediumPath, patterns) ||
                    // Also check if base key matches
                    (img.filePath && img.filePath.includes(baseKey))
                ) {
                    if (usageMap[key]) {
                        usageMap[key].used = true;
                        usageMap[key].references.push({
                            type: 'GalleryImage',
                            id: img.id,
                            title: img.title || 'Gallery Image',
                            url: `/admin/gallery?highlight=${img.id}`,
                        });
                    }
                }
            }
        }

        // 2. Check Post coverImagePath
        const posts = await prisma.post.findMany({
            where: { coverImagePath: { not: null } },
            select: {
                id: true,
                title: true,
                slug: true,
                locale: true,
                coverImagePath: true,
            },
        });

        for (const post of posts) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                if (matchesAnyPattern(post.coverImagePath, patterns) && usageMap[key]) {
                    usageMap[key].used = true;
                    usageMap[key].references.push({
                        type: 'Post',
                        id: post.id,
                        title: post.title,
                        url: `/${post.locale.toLowerCase()}/posts/${post.slug}`,
                    });
                }
            }
        }

        // 3. Check Moment images (JSON field)
        const moments = await prisma.moment.findMany({
            where: {
                images: { not: Prisma.JsonNull },
                deletedAt: null,
            },
            select: {
                id: true,
                slug: true,
                content: true,
                images: true,
            },
        });

        for (const moment of moments) {
            if (!moment.images) continue;
            const images = moment.images as Array<{
                url?: string;
                microThumbUrl?: string;
                smallThumbUrl?: string;
                mediumUrl?: string;
            }>;

            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;

                for (const img of images) {
                    if (
                        matchesAnyPattern(img.url, patterns) ||
                        matchesAnyPattern(img.microThumbUrl, patterns) ||
                        matchesAnyPattern(img.smallThumbUrl, patterns) ||
                        matchesAnyPattern(img.mediumUrl, patterns)
                    ) {
                        if (usageMap[key]) {
                            usageMap[key].used = true;
                            usageMap[key].references.push({
                                type: 'Moment',
                                id: moment.id,
                                title: moment.content.substring(0, 50) + (moment.content.length > 50 ? '...' : ''),
                                url: `/moments/${moment.slug || moment.id}`,
                            });
                        }
                        break; // Only add one reference per moment
                    }
                }
            }
        }

        // 4. Check HeroImage
        const heroImages = await prisma.heroImage.findMany({
            select: {
                id: true,
                url: true,
            },
        });

        for (const hero of heroImages) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                if (matchesAnyPattern(hero.url, patterns) && usageMap[key]) {
                    usageMap[key].used = true;
                    usageMap[key].references.push({
                        type: 'HeroImage',
                        id: hero.id,
                        title: 'Hero Image',
                        url: '/admin/hero',
                    });
                }
            }
        }

        // 5. Check Project imageUrl (may be external)
        const projects = await prisma.project.findMany({
            where: { imageUrl: { not: null } },
            select: {
                id: true,
                title: true,
                imageUrl: true,
            },
        });

        for (const project of projects) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                if (matchesAnyPattern(project.imageUrl, patterns) && usageMap[key]) {
                    usageMap[key].used = true;
                    usageMap[key].references.push({
                        type: 'Project',
                        id: project.id,
                        title: project.title,
                        url: '/admin/projects',
                    });
                }
            }
        }

        // 6. Check ShareItem imageUrl (may be external)
        const shareItems = await prisma.shareItem.findMany({
            where: { imageUrl: { not: null } },
            select: {
                id: true,
                title: true,
                imageUrl: true,
            },
        });

        for (const item of shareItems) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                if (matchesAnyPattern(item.imageUrl, patterns) && usageMap[key]) {
                    usageMap[key].used = true;
                    usageMap[key].references.push({
                        type: 'ShareItem',
                        id: item.id,
                        title: item.title,
                        url: '/admin/curated',
                    });
                }
            }
        }

        // 7. Check Friend avatar and cover
        const friends = await prisma.friend.findMany({
            select: {
                id: true,
                name: true,
                avatar: true,
                cover: true,
            },
        });

        for (const friend of friends) {
            for (const key of keys) {
                const patterns = keyPatterns.get(key);
                if (!patterns) continue;
                if ((matchesAnyPattern(friend.avatar, patterns) || matchesAnyPattern(friend.cover, patterns)) && usageMap[key]) {
                    usageMap[key].used = true;
                    usageMap[key].references.push({
                        type: 'Friend',
                        id: friend.id,
                        title: friend.name,
                        url: '/admin/friends',
                    });
                }
            }
        }

        // Calculate summary
        const usedCount = Object.values(usageMap).filter(u => u.used).length;
        const unusedCount = keys.length - usedCount;

        return NextResponse.json({
            usage: usageMap,
            summary: {
                total: keys.length,
                used: usedCount,
                unused: unusedCount,
            },
        });
    } catch (error) {
        console.error("[Storage API] Check usage error:", error);
        return NextResponse.json(
            { error: "Failed to check image usage" },
            { status: 500 }
        );
    }
}
