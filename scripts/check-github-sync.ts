import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("\n=== Checking GitHub Sync Status ===\n");

    // Check GitHub credential
    const cred = await prisma.externalCredential.findFirst({
        where: { platform: "GITHUB" },
        select: { id: true, isValid: true, lastValidatedAt: true, lastUsedAt: true },
    });
    console.log("GitHub Credential:", cred ? "✅ Found" : "❌ Not found");
    if (cred) {
        console.log("  - ID:", cred.id);
        console.log("  - Valid:", cred.isValid);
        console.log("  - Last Validated:", cred.lastValidatedAt);
    }

    // Check GitHub languages
    const langs = await prisma.gitHubLanguage.findMany({
        orderBy: { percentage: "desc" },
    });
    console.log("\nGitHub Languages:", langs.length > 0 ? `✅ ${langs.length} found` : "❌ Empty");
    if (langs.length > 0) {
        for (const lang of langs) {
            console.log(`  - ${lang.name}: ${lang.percentage}%`);
        }
    }

    // Check GitHub stats
    const stats = await prisma.gitHubStats.findFirst({
        orderBy: { syncedAt: "desc" },
    });
    console.log("\nGitHub Stats:", stats ? "✅ Found" : "❌ Not found");
    if (stats) {
        console.log("  - Commits (week):", stats.commitsWeek);
        console.log("  - Current Streak:", stats.currentStreak);
        console.log("  - Synced At:", stats.syncedAt);
    }

    console.log("\n=== Done ===\n");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
    });
