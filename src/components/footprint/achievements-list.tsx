"use client";

import { useState, useEffect } from "react";
import { Trophy, Lock, Sparkles } from "lucide-react";

interface Achievement {
    id: string;
    code: string;
    name: string;
    nameEn: string | null;
    description: string;
    descriptionEn: string | null;
    icon: string;
    category: string;
    threshold: number;
    progress: number;
    unlockedAt: string | null;
    isUnlocked: boolean;
}

interface AchievementsListProps {
    locale: "zh" | "en";
}

const categoryNames: Record<string, { zh: string; en: string }> = {
    distance: { zh: "里程", en: "Distance" },
    cities: { zh: "城市", en: "Cities" },
    trips: { zh: "出行", en: "Trips" },
    special: { zh: "特殊", en: "Special" },
};

export function AchievementsList({ locale }: AchievementsListProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/footprint/achievements");
                const data = await res.json();
                setAchievements(data.achievements || []);
            } catch (err) {
                console.error("Failed to load achievements:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalCount = achievements.length;

    // Group by category
    const grouped = achievements.reduce((acc, a) => {
        if (!acc[a.category]) acc[a.category] = [];
        acc[a.category]!.push(a);
        return acc;
    }, {} as Record<string, Achievement[]>);

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <div className="flex gap-1">
                    <span className="size-2 animate-pulse rounded-full bg-stone-400" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-stone-800">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {locale === "zh" ? "成就" : "Achievements"}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {unlockedCount}/{totalCount}
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-6">
                {Object.entries(grouped).map(([category, categoryAchievements]) => (
                    <div key={category}>
                        <h3 className="mb-3 text-sm font-medium text-stone-500 dark:text-stone-400">
                            {categoryNames[category]?.[locale] || category}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {categoryAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className={`relative rounded-xl border p-3 transition-all ${achievement.isUnlocked
                                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                                        : "border-stone-100 bg-stone-50 opacity-60 dark:border-stone-700 dark:bg-stone-800/50"
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="mb-2 text-2xl">
                                        {achievement.icon}
                                        {!achievement.isUnlocked && (
                                            <Lock className="absolute right-2 top-2 h-3.5 w-3.5 text-stone-400" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                                        {locale === "en" && achievement.nameEn ? achievement.nameEn : achievement.name}
                                    </div>

                                    {/* Progress */}
                                    {!achievement.isUnlocked && (
                                        <div className="mt-2">
                                            <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-700">
                                                <div
                                                    className="h-full rounded-full bg-amber-400"
                                                    style={{ width: `${Math.min(100, (achievement.progress / achievement.threshold) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 text-xs text-stone-400">
                                                {Math.round(achievement.progress)}/{achievement.threshold}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unlocked date */}
                                    {achievement.isUnlocked && achievement.unlockedAt && (
                                        <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                            {new Date(achievement.unlockedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
