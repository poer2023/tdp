/**
 * Seed script for mock footprint data
 * Run with: npx tsx scripts/seed-footprint.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Beijing -> Shanghai polyline (simplified)
const beijingToShanghai = "_pvsFdovgT~qB~hC|_@|bB`eBxmDvdBhrCbaB~tC~uAxlDjjB~|DbdC~pEb|BxyE`jChvFdaC~yFh}Bj|FxtBt{FfnBb|FhfBrxFv|Ad~Fhp@beGfG~nGsUvxGck@~}Gmu@z_H}r@~}Gik@rzGc[jrGmGjhGtJb~FhX|rFxg@rfFxr@zyExu@tmEtl@x}Dv^tmDxGpaDgDxqCkTbgDoRf{Ci@zqC";

// Hangzhou West Lake walking trail
const westLakeTrail = "ozweFgmxuSgBmCiC_EoCaFkBwFy@kGWsGDsGj@qGvAkGxBcGdDyFzE{EbGoDbIoBbKg@rL@xLn@`M|A|LbChLdE~K|FhKzH~IvJhIpLdHzMdGvN|ExObD~PjBvQb@zQc@`ReBbR}ClQoE|OwF|NwGpMiI~KmJfJqKnHyL|F}MhEeNtCgNz@oNYmNwAgN_DuMoE}LcG}KqHoKcJaKsKkJwLsIoMwH}MuGwN{FkOiF}O";

// Shanghai city walk
const shanghaiWalk = "geqhFivxrSyAuBcB}AeBgA_C]sBDsBl@kBnAuAdBaAfCa@~Ca@bDmAxC}ApCcBpBeBnAmBv@mBPoB_@qB_AaCuAaC}BiB{CaBwDkA}D_AoEg@qEIaEv@{Dz@yDvA}CbB_CrBoB~B_BdCq@bCGxBj@~BvA`CjB`ChCnBxCpA|C|@~Cn@hDX~CANANAPAPALALALAL";

// Tesla drive Beijing suburbs
const beijingDrive = "yvvsFuqugTnGpKxMlPjR`StVjT`ZvSv\\lRz]lOr^tK~^~Fx_@Xz_@sA|_@{C~^gFz]sH~[}Jf[}L`Z{NxXqPdWkRrUmT~RsVvPyXfLmaAnFjLnAxG`A~Gv@bIf@xIJpISpI}@tIeBjIqCvH_ElH}E`GoFnFaGtEiGxDoGnC{GbBqG|@}GRmH_@cH_AyG}AwGqBmGoCaG}CqFoDoFgEaF}E{E";

async function main() {
    console.log("🚀 Seeding footprint data...");

    // Clear existing data
    await prisma.footprint.deleteMany({});

    const now = new Date();

    const footprints = [
        {
            type: "DRIVE" as const,
            source: "TESLAMATE" as const,
            title: "北京 → 上海",
            startTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            endTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
            distance: 1200.5,
            duration: 12 * 60 * 60, // 12 hours
            polyline: beijingToShanghai,
            startLat: 39.9042,
            startLng: 116.4074,
            endLat: 31.2304,
            endLng: 121.4737,
            startAddr: "北京市朝阳区",
            endAddr: "上海市浦东新区",
            metadata: {
                energyUsed: 280, // kWh
                avgSpeed: 100, // km/h
                maxSpeed: 130,
            },
        },
        {
            type: "WALK" as const,
            source: "YISHENGZUJI" as const,
            title: "西湖环湖徒步",
            startTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            endTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            distance: 15.2,
            duration: 4 * 60 * 60, // 4 hours
            polyline: westLakeTrail,
            startLat: 30.2500,
            startLng: 120.1500,
            endLat: 30.2520,
            endLng: 120.1480,
            startAddr: "杭州市西湖区",
            endAddr: "杭州市西湖区",
            metadata: {
                steps: 22000,
                elevationGain: 150,
            },
        },
        {
            type: "WALK" as const,
            source: "YISHENGZUJI" as const,
            title: "外滩散步",
            startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            distance: 5.8,
            duration: 2 * 60 * 60, // 2 hours
            polyline: shanghaiWalk,
            startLat: 31.2400,
            startLng: 121.4900,
            endLat: 31.2350,
            endLng: 121.4850,
            startAddr: "上海市外滩",
            endAddr: "上海市南京路",
            metadata: {
                steps: 8500,
            },
        },
        {
            type: "DRIVE" as const,
            source: "TESLAMATE" as const,
            title: "京郊自驾",
            startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            distance: 120.3,
            duration: 3 * 60 * 60, // 3 hours
            polyline: beijingDrive,
            startLat: 39.9200,
            startLng: 116.4600,
            endLat: 40.0500,
            endLng: 116.2800,
            startAddr: "北京市朝阳区",
            endAddr: "北京市昌平区",
            metadata: {
                energyUsed: 25,
                avgSpeed: 40,
            },
        },
        {
            type: "RUN" as const,
            source: "MANUAL" as const,
            title: "晨跑",
            startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // yesterday
            endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
            distance: 5.0,
            duration: 45 * 60, // 45 minutes
            startLat: 39.9100,
            startLng: 116.4100,
            endLat: 39.9100,
            endLng: 116.4100,
            startAddr: "北京市朝阳公园",
            endAddr: "北京市朝阳公园",
            metadata: {
                steps: 6500,
                avgPace: "5:30/km",
            },
        },
        {
            type: "BIKE" as const,
            source: "MANUAL" as const,
            title: "骑行通勤",
            startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            endTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
            distance: 8.5,
            duration: 30 * 60, // 30 minutes
            startLat: 39.9000,
            startLng: 116.4000,
            endLat: 39.9200,
            endLng: 116.4500,
            startAddr: "北京市朝阳区家",
            endAddr: "北京市朝阳区公司",
            metadata: {
                avgSpeed: 17,
            },
        },
    ];

    for (const footprint of footprints) {
        await prisma.footprint.create({ data: footprint });
    }

    console.log(`✅ Created ${footprints.length} mock footprints`);

    // Display stats
    const stats = await prisma.footprint.aggregate({
        _count: true,
        _sum: { distance: true, duration: true },
    });

    console.log(`📊 Stats:`);
    console.log(`   Total trips: ${stats._count}`);
    console.log(`   Total distance: ${stats._sum.distance?.toFixed(1)} km`);
    console.log(`   Total duration: ${Math.round((stats._sum.duration || 0) / 3600)} hours`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
