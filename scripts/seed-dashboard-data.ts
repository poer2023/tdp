#!/usr/bin/env npx ts-node
/**
 * Seed script for Dashboard Data
 *
 * Seeds SkillData and RoutineData tables with default values.
 * Run: npx ts-node scripts/seed-dashboard-data.ts
 *
 * You can customize the data below before running.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ----- Customize your data here -----

const skillData = [
    { name: "React/Next.js", level: 90, category: "Development" },
    { name: "TypeScript", level: 85, category: "Development" },
    { name: "Product Design", level: 80, category: "Design" },
    { name: "Photography", level: 75, category: "Creative" },
];

const routineData = [
    { name: "Work", value: 8, color: "#5c9c6d" }, // Green
    { name: "Sleep", value: 7, color: "#6366f1" }, // Indigo
    { name: "Creative", value: 4, color: "#f59e0b" }, // Amber
    { name: "Exercise", value: 1, color: "#ef4444" }, // Red
    { name: "Other", value: 4, color: "#a8a29e" }, // Stone
];

// ----- End customization -----

async function main() {
    console.log("🌱 Seeding Dashboard Data...\n");

    // Clear existing data
    console.log("⏳ Clearing existing SkillData and RoutineData...");
    await prisma.skillData.deleteMany({});
    await prisma.routineData.deleteMany({});

    // Seed SkillData
    console.log("📊 Seeding SkillData...");
    for (const skill of skillData) {
        await prisma.skillData.create({
            data: skill,
        });
        console.log(`   ✅ ${skill.name}: ${skill.level}%`);
    }

    // Seed RoutineData
    console.log("\n📊 Seeding RoutineData...");
    for (const routine of routineData) {
        await prisma.routineData.create({
            data: routine,
        });
        console.log(
            `   ✅ ${routine.name}: ${routine.value}h (${routine.color})`
        );
    }

    console.log("\n✨ Dashboard data seeded successfully!");
    console.log(
        "\n💡 Visit /about/live to see the data in action."
    );
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error seeding data:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
