/**
 * Achievement data layer
 */

import { prisma } from "@/lib/prisma";

// Predefined achievements
export const ACHIEVEMENTS = [
    // Distance achievements
    { code: "walker_10k", name: "初级步行者", nameEn: "Casual Walker", description: "累计步行超过10公里", descriptionEn: "Walk over 10km total", icon: "👟", category: "distance", threshold: 10 },
    { code: "walker_100k", name: "马拉松达人", nameEn: "Marathon Master", description: "累计步行超过100公里", descriptionEn: "Walk over 100km total", icon: "🏃", category: "distance", threshold: 100 },
    { code: "driver_500k", name: "公路之王", nameEn: "Road King", description: "累计驾驶超过500公里", descriptionEn: "Drive over 500km total", icon: "🛣️", category: "distance", threshold: 500 },
    { code: "cyclist_100k", name: "骑行爱好者", nameEn: "Cycling Lover", description: "累计骑行超过100公里", descriptionEn: "Cycle over 100km total", icon: "🚴", category: "distance", threshold: 100 },
    { code: "globetrotter", name: "环球旅者", nameEn: "Globetrotter", description: "累计里程超过40,000公里（地球周长）", descriptionEn: "Travel over 40,000km (Earth's circumference)", icon: "🌍", category: "distance", threshold: 40000 },

    // Cities achievements
    { code: "city_explorer_5", name: "城市探索者", nameEn: "City Explorer", description: "访问5个不同城市", descriptionEn: "Visit 5 different cities", icon: "🏙️", category: "cities", threshold: 5 },
    { code: "city_hunter_10", name: "城市猎人", nameEn: "City Hunter", description: "访问10个不同城市", descriptionEn: "Visit 10 different cities", icon: "🌆", category: "cities", threshold: 10 },
    { code: "city_master_20", name: "城市大师", nameEn: "City Master", description: "访问20个不同城市", descriptionEn: "Visit 20 different cities", icon: "🏛️", category: "cities", threshold: 20 },

    // Trip count achievements
    { code: "trips_10", name: "起步者", nameEn: "Starter", description: "完成10次出行", descriptionEn: "Complete 10 trips", icon: "🎯", category: "trips", threshold: 10 },
    { code: "trips_50", name: "常旅客", nameEn: "Frequent Traveler", description: "完成50次出行", descriptionEn: "Complete 50 trips", icon: "⭐", category: "trips", threshold: 50 },
    { code: "trips_100", name: "旅行达人", nameEn: "Travel Pro", description: "完成100次出行", descriptionEn: "Complete 100 trips", icon: "💫", category: "trips", threshold: 100 },

    // Special achievements
    { code: "single_trip_50k", name: "长途挑战", nameEn: "Long Haul", description: "单次行程超过50公里", descriptionEn: "Single trip over 50km", icon: "🏆", category: "special", threshold: 50 },
    { code: "single_trip_200k", name: "远征勇士", nameEn: "Expedition Warrior", description: "单次行程超过200公里", descriptionEn: "Single trip over 200km", icon: "🎖️", category: "special", threshold: 200 },
];

/**
 * Initialize achievements in database
 */
export async function initializeAchievements() {
    for (const a of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { code: a.code },
            create: a,
            update: { name: a.name, description: a.description, icon: a.icon, category: a.category, threshold: a.threshold },
        });
    }
    return ACHIEVEMENTS.length;
}

/**
 * Get all achievements with user progress
 */
export async function getAchievementsWithProgress() {
    const achievements = await prisma.achievement.findMany({
        orderBy: [{ category: "asc" }, { order: "asc" }],
        include: { userAchievements: true },
    });

    return achievements.map((a) => {
        const ua = a.userAchievements[0];
        return {
            id: a.id,
            code: a.code,
            name: a.name,
            nameEn: a.nameEn,
            description: a.description,
            descriptionEn: a.descriptionEn,
            icon: a.icon,
            category: a.category,
            threshold: a.threshold,
            progress: ua?.progress || 0,
            unlockedAt: ua?.unlockedAt || null,
            isUnlocked: !!ua?.unlockedAt,
        };
    });
}

/**
 * Update achievement progress based on current footprint stats
 */
export async function updateAchievementProgress() {
    // Get overall stats
    const stats = await prisma.footprint.aggregate({
        _count: { id: true },
        _sum: { distance: true },
    });

    // Get type-specific distances
    const typeStats = await prisma.footprint.groupBy({
        by: ["type"],
        _sum: { distance: true },
    });

    // Get city count
    const cities = await prisma.city.count({ where: { visits: { gt: 0 } } });

    // Get longest single trip
    const longestTrip = await prisma.footprint.findFirst({
        where: { distance: { not: null } },
        orderBy: { distance: "desc" },
        select: { distance: true },
    });

    // Calculate progress for each achievement
    const progressMap: Record<string, number> = {
        walker_10k: typeStats.find((t) => t.type === "WALK")?._sum.distance || 0,
        walker_100k: typeStats.find((t) => t.type === "WALK")?._sum.distance || 0,
        driver_500k: typeStats.find((t) => t.type === "DRIVE")?._sum.distance || 0,
        cyclist_100k: typeStats.find((t) => t.type === "BIKE")?._sum.distance || 0,
        globetrotter: stats._sum.distance || 0,
        city_explorer_5: cities,
        city_hunter_10: cities,
        city_master_20: cities,
        trips_10: stats._count.id,
        trips_50: stats._count.id,
        trips_100: stats._count.id,
        single_trip_50k: longestTrip?.distance || 0,
        single_trip_200k: longestTrip?.distance || 0,
    };

    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    // Update progress
    for (const achievement of achievements) {
        const progress = progressMap[achievement.code] || 0;
        const isUnlocked = progress >= achievement.threshold;

        await prisma.userAchievement.upsert({
            where: { achievementId: achievement.id },
            create: {
                achievementId: achievement.id,
                progress,
                unlockedAt: isUnlocked ? new Date() : null,
            },
            update: {
                progress,
                unlockedAt: isUnlocked ? new Date() : undefined,
            },
        });
    }
}
