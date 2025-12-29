/**
 * Seed script for REALISTIC footprint data (V2)
 * Run with: npx tsx scripts/seed-footprint-v2.ts
 */

import { PrismaClient } from "@prisma/client";
import { encodePolyline } from "../src/lib/footprint/gpx-parser";

const prisma = new PrismaClient();

// Helper to interpolate points between waypoints for smoother lines
function interpolatePoints(
    waypoints: [number, number][],
    stepsPerSegment: number = 20
): { lat: number; lon: number }[] {
    const points: { lat: number; lon: number }[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        for (let step = 0; step <= stepsPerSegment; step++) {
            const t = step / stepsPerSegment;
            // Linear interpolation (good enough for mock)
            // Add some random jitter for "GPS noise" realism
            const jitterLat = (Math.random() - 0.5) * 0.0001;
            const jitterLng = (Math.random() - 0.5) * 0.0001;

            const lat = start[0] + (end[0] - start[0]) * t + jitterLat;
            const lon = start[1] + (end[1] - start[1]) * t + jitterLng;

            points.push({ lat, lon });
        }
    }
    return points;
}

async function main() {
    console.log("🚀 Seeding REALISTIC footprint data...");

    // Clear existing data
    await prisma.footprint.deleteMany({});

    const now = new Date();

    // --- Beijing Cycling Route: Sanlitun -> Liangma River -> Chaoyang Park -> CCTV ---
    const beijingWaypoints: [number, number][] = [
        [39.9355, 116.4551], // Sanlitun Taikoo Li
        [39.9380, 116.4555], // Move North
        [39.9450, 116.4580], // Liangma River start
        [39.9455, 116.4650], // Liangma River path
        [39.9460, 116.4750], // Liangma River end
        [39.9427, 116.4760], // Chaoyang Park West Gate
        [39.9380, 116.4770], // Inside Park
        [39.9320, 116.4780], // Park South Gate
        [39.9250, 116.4750], // Chaoyang Park Rd
        [39.9138, 116.4600], // CCTV HQ (End)
    ];

    const beijingPoints = interpolatePoints(beijingWaypoints, 30);
    // Add timestamps and elevation
    const beijingTrackPoints = beijingPoints.map((p, i) => ({
        ...p,
        ele: 40 + Math.random() * 5, // ~40m elevation
        time: new Date(now.getTime() - 24 * 3600 * 1000 + i * 30000), // Yesterday, 30s per point
    }));

    const beijingPolyline = encodePolyline(beijingTrackPoints);
    const beijingDistance = 12.5; // Estimated km
    const beijingDuration = 45 * 60; // 45 mins

    // --- Shanghai City Walk: Wukang Mansion -> Anfu Rd -> Jing'an Temple ---
    const shanghaiWaypoints: [number, number][] = [
        [31.2023, 121.4367], // Wukang Mansion
        [31.2050, 121.4350], // Wukang Rd
        [31.2080, 121.4355], // Wukang Rd / Ferguson Lane
        [31.2130, 121.4380], // Towards Anfu
        [31.2155, 121.4422], // Anfu Road
        [31.2180, 121.4440], // Changshu Rd
        [31.2235, 121.4460], // Jing'an Temple (End)
    ];
    const shanghaiPoints = interpolatePoints(shanghaiWaypoints, 40); // More dense for walking
    const shanghaiTrackPoints = shanghaiPoints.map((p, i) => ({
        ...p,
        ele: 4 + Math.random() * 2, // ~4m elevation
        time: new Date(now.getTime() - 48 * 3600 * 1000 + i * 60000), // 2 days ago, 1 min per point
    }));

    const shanghaiPolyline = encodePolyline(shanghaiTrackPoints);
    const shanghaiDistance = 4.2; // Estimated km
    const shanghaiDuration = 90 * 60; // 1.5 hours

    const footprints = [
        {
            type: "BIKE" as const,
            source: "STRAVA" as const,
            title: "骑行北京：三里屯到 CBD",
            startTime: beijingTrackPoints[0].time!,
            endTime: beijingTrackPoints[beijingTrackPoints.length - 1].time!,
            distance: beijingDistance,
            duration: beijingDuration,
            polyline: beijingPolyline,
            startLat: beijingWaypoints[0][0],
            startLng: beijingWaypoints[0][1],
            endLat: beijingWaypoints[beijingWaypoints.length - 1][0],
            endLng: beijingWaypoints[beijingWaypoints.length - 1][1],
            startAddr: "北京市朝阳区三里屯",
            endAddr: "北京市朝阳区 CBD",
            metadata: {
                avgSpeed: 18.5,
                calories: 320,
                heartRate: 145,
            },
        },
        {
            type: "WALK" as const,
            source: "YISHENGZUJI" as const,
            title: "上海 City Walk：武康路至静安寺",
            startTime: shanghaiTrackPoints[0].time!,
            endTime: shanghaiTrackPoints[shanghaiTrackPoints.length - 1].time!,
            distance: shanghaiDistance,
            duration: shanghaiDuration,
            polyline: shanghaiPolyline,
            startLat: shanghaiWaypoints[0][0],
            startLng: shanghaiWaypoints[0][1],
            endLat: shanghaiWaypoints[shanghaiWaypoints.length - 1][0],
            endLng: shanghaiWaypoints[shanghaiWaypoints.length - 1][1],
            startAddr: "上海市徐汇区武康大楼",
            endAddr: "上海市静安寺",
            metadata: {
                steps: 6100,
                calories: 210,
            },
        }
    ];

    for (const footprint of footprints) {
        await prisma.footprint.create({ data: footprint });
    }

    console.log(`✅ Created ${footprints.length} realistic footprints`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
