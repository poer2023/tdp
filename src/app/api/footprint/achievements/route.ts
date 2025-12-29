/**
 * Achievements API
 */

import { NextResponse } from "next/server";
import { getAchievementsWithProgress, initializeAchievements, updateAchievementProgress } from "@/lib/footprint/achievement";

export async function GET() {
    try {
        const achievements = await getAchievementsWithProgress();
        return NextResponse.json({ achievements });
    } catch (error) {
        console.error("Achievements API error:", error);
        return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
    }
}

// POST to initialize/update achievements
export async function POST() {
    try {
        await initializeAchievements();
        await updateAchievementProgress();
        const achievements = await getAchievementsWithProgress();
        return NextResponse.json({
            initialized: true,
            achievements,
        });
    } catch (error) {
        console.error("Achievements init error:", error);
        return NextResponse.json({ error: "Failed to initialize achievements" }, { status: 500 });
    }
}
