import prisma from "@/lib/prisma";

/**
 * Dashboard Stats Data structure for ZhiStatsDashboard
 */
export interface DashboardStatsData {
    photoCount: number;
    photosByWeek: { day: string; count: number }[];
    routineData: { name: string; value: number; color: string }[];
    stepsData: {
        entries: { day: string; dayNum: number; steps: number }[];
        startDate: string;
        endDate: string;
    };
    movieCount: number;
    movieData: { month: string; movies: number }[];
    skillData: { name: string; level: number }[];
    currentGame?: { name: string; progress: number };
}

/**
 * Get the latest game being played
 */
async function getLatestGame(): Promise<{ name: string; progress: number } | undefined> {
    try {
        const latestSession = await prisma.gameSession.findFirst({
            orderBy: { startTime: "desc" },
            include: { game: true },
        });

        if (!latestSession?.game) return undefined;

        const game = latestSession.game;
        let progress = 50;

        const achievements = await prisma.gameAchievement.findMany({
            where: { gameId: game.id },
        });

        if (achievements.length > 0) {
            const unlocked = achievements.filter((a) => a.isUnlocked).length;
            progress = Math.round((unlocked / achievements.length) * 100);
        }

        return {
            name: game.nameZh || game.name,
            progress,
        };
    } catch {
        return undefined;
    }
}

/**
 * Get programming languages from GitHub data
 */
async function getLanguagesFromDB(): Promise<
    Array<{ name: string; percentage: number; hours: number }>
> {
    try {
        const p = prisma as any;

        if (!p.gitHubLanguage?.findMany) return [];

        const langRecords = await p.gitHubLanguage.findMany({
            orderBy: { syncedAt: "desc" },
            take: 50,
        });

        const seen = new Set<string>();
        const languages: Array<{ name: string; percentage: number; hours: number }> = [];

        for (const l of langRecords) {
            const name = (l as { name: string }).name;
            if (name && !seen.has(name)) {
                seen.add(name);
                languages.push({
                    name,
                    percentage: (l as { percentage: number }).percentage,
                    hours: (l as { hours: number }).hours,
                });
            }
            if (languages.length >= 4) break;
        }

        return languages;
    } catch {
        return [];
    }
}

/**
 * Process photos into weekly distribution
 */
function processPhotosByWeek(
    photos: Array<{ createdAt: Date }>
): Array<{ day: string; count: number }> {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {};

    days.forEach((day) => {
        counts[day] = 0;
    });

    photos.forEach((photo) => {
        const dayIndex = new Date(photo.createdAt).getDay();
        const dayName = days[dayIndex];
        if (dayName) {
            counts[dayName] = (counts[dayName] || 0) + 1;
        }
    });

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        count: counts[day] || 0,
    }));
}

/**
 * Process movies into monthly distribution
 */
function processMoviesByMonth(media: Array<{ watchedAt: Date | null }>): {
    movieCount: number;
    movieData: Array<{ month: string; movies: number }>;
} {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    const now = new Date();

    const last4Months: string[] = [];
    for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        if (monthName) {
            last4Months.push(monthName);
            counts[monthName] = 0;
        }
    }

    media.forEach((item) => {
        if (!item.watchedAt) return;
        const watchedDate = new Date(item.watchedAt);
        const monthName = months[watchedDate.getMonth()];
        if (monthName && counts[monthName] !== undefined) {
            counts[monthName]++;
        }
    });

    return {
        movieCount: media.length,
        movieData: last4Months.map((month) => ({
            month,
            movies: counts[month] || 0,
        })),
    };
}

/**
 * Build skill data from programming languages
 */
function buildSkillData(
    languages: Array<{ name: string; percentage: number; hours: number }>
): Array<{ name: string; level: number }> {
    if (languages.length === 0) {
        return [
            { name: "React/Next.js", level: 90 },
            { name: "TypeScript", level: 85 },
            { name: "Product Design", level: 80 },
            { name: "Photography", level: 75 },
        ];
    }

    return languages.slice(0, 4).map((lang) => ({
        name: lang.name,
        level: Math.min(95, Math.round(lang.percentage * 1.2 + 50)),
    }));
}

/**
 * Get steps data from database (last 7 days)
 */
async function getStepsDataFromDB(): Promise<{
    entries: Array<{ day: string; dayNum: number; steps: number }>;
    startDate: string;
    endDate: string;
}> {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        sevenDaysAgo.setUTCHours(0, 0, 0, 0);

        const stepsRecords = await prisma.stepsData.findMany({
            where: {
                date: { gte: sevenDaysAgo },
            },
            orderBy: { date: "asc" },
            take: 7,
        });

        const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
        const getDayNum = (jsDay: number): number => (jsDay === 0 ? 7 : jsDay);

        const formatDate = (d: Date): string => {
            const month = d.getMonth() + 1;
            const day = d.getDate();
            return `${month}/${day}`;
        };

        if (stepsRecords.length === 0) {
            return {
                entries: [
                    { day: "M", dayNum: 1, steps: 0 },
                    { day: "T", dayNum: 2, steps: 0 },
                    { day: "W", dayNum: 3, steps: 0 },
                    { day: "T", dayNum: 4, steps: 0 },
                    { day: "F", dayNum: 5, steps: 0 },
                    { day: "S", dayNum: 6, steps: 0 },
                    { day: "S", dayNum: 7, steps: 0 },
                ],
                startDate: formatDate(sevenDaysAgo),
                endDate: formatDate(now),
            };
        }

        const firstDate = stepsRecords[0]?.date;
        const lastDate = stepsRecords[stepsRecords.length - 1]?.date;

        return {
            entries: stepsRecords.map((record) => ({
                day: dayNames[record.date.getDay()] || "?",
                dayNum: getDayNum(record.date.getDay()),
                steps: record.steps,
            })),
            startDate: firstDate ? formatDate(firstDate) : "",
            endDate: lastDate ? formatDate(lastDate) : "",
        };
    } catch (error) {
        console.error("[Dashboard Stats] Error fetching steps data:", error);
        return {
            entries: [],
            startDate: "",
            endDate: "",
        };
    }
}

/**
 * Fetch all dashboard stats from the database
 * Can be called from Server Components directly
 */
export async function getDashboardStats(): Promise<DashboardStatsData> {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [
            photoCount,
            recentPhotos,
            mediaThisYear,
            currentlyPlayingGame,
            languages,
        ] = await Promise.all([
            prisma.galleryImage.count(),
            prisma.galleryImage.findMany({
                where: {
                    createdAt: {
                        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                select: { createdAt: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.mediaWatch.findMany({
                where: {
                    type: "movie",
                    watchedAt: { gte: startOfYear },
                },
                select: { watchedAt: true },
                orderBy: { watchedAt: "desc" },
            }),
            getLatestGame(),
            getLanguagesFromDB(),
        ]);

        const photosByWeek = processPhotosByWeek(recentPhotos);
        const { movieCount, movieData } = processMoviesByMonth(mediaThisYear);
        const skillData = buildSkillData(languages);
        const routineData = [
            { name: "Work", value: 8, color: "#5c9c6d" },
            { name: "Sleep", value: 7, color: "#6366f1" },
            { name: "Creative", value: 4, color: "#f59e0b" },
            { name: "Exercise", value: 1, color: "#ef4444" },
            { name: "Other", value: 4, color: "#a8a29e" },
        ];
        const stepsData = await getStepsDataFromDB();

        return {
            photoCount,
            photosByWeek,
            routineData,
            stepsData,
            movieCount,
            movieData,
            skillData,
            currentGame: currentlyPlayingGame,
        };
    } catch (error) {
        console.error("[Dashboard Stats] Error fetching data:", error);

        // Return fallback data on error
        return {
            photoCount: 0,
            photosByWeek: [],
            routineData: [],
            stepsData: { entries: [], startDate: "", endDate: "" },
            movieCount: 0,
            movieData: [],
            skillData: [],
            currentGame: undefined,
        };
    }
}
