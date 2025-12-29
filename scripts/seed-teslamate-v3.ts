/**
 * Seed script for 20 realistic TeslaMate mock drives
 * Generates human-like commuting and weekend patterns
 */

import { PrismaClient } from "@prisma/client";
import { TeslaMateClient, TeslaMateDrive, TeslaMatePosition } from "../src/lib/footprint/teslamate";
import { syncCitiesFromFootprints } from "../src/lib/footprint/city";
import { updateAchievementProgress } from "../src/lib/footprint/achievement";

const prisma = new PrismaClient();

// O-D pairs with approximate coordinates
const LOCATIONS = {
    HOME: { name: "北京朝阳区望京花园", lat: 40.003, lng: 116.475 },
    OFFICE: { name: "北京海淀区中关村软件园", lat: 40.045, lng: 116.295 },
    MALL: { name: "北京朝阳区蓝色港湾", lat: 39.955, lng: 116.475 },
    SANLITUN: { name: "北京朝阳区三里屯", lat: 39.935, lng: 116.455 },
    UNIVERSAL: { name: "北京通州区环球度假区", lat: 39.855, lng: 116.675 },
    AIRPORT: { name: "北京大兴国际机场", lat: 39.510, lng: 116.415 },
    TIANJIN: { name: "天津市滨海新区", lat: 39.015, lng: 117.712 },
};

// Road-following waypoints for common routes
const PATHS = {
    // Wangjing -> Zhongguancun via 5th Ring
    COMMUTE: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 40.015, lng: 116.475 }, // Laiguangying Bridge
        { lat: 40.015, lng: 116.425 }, // Beiyuan Bridge
        { lat: 40.015, lng: 116.395 }, // Yangshan Bridge
        { lat: 40.020, lng: 116.355 }, // Shangqing Bridge
        { lat: 40.035, lng: 116.315 }, // Xiaojiahe Bridge
        { lat: 40.045, lng: 116.295 }, // Office
    ],
    // Wangjing -> Sanlitun via 4th Ring
    SHOPPING: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 39.985, lng: 116.475 }, // Siyuan Bridge
        { lat: 39.965, lng: 116.485 }, // Dongfeng Bridge
        { lat: 39.945, lng: 116.465 }, // Agricultural Exhibition
        { lat: 39.935, lng: 116.455 }, // Sanlitun
    ],
    // Wangjing -> Mall
    MALL: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 39.985, lng: 116.475 }, // Siyuan Bridge
        { lat: 39.975, lng: 116.475 }, // Xiaoyun Bridge
        { lat: 39.955, lng: 116.475 }, // Mall
    ],
    // Wangjing -> Universal via 5th Ring
    UNIVERSAL: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 39.985, lng: 116.485 }, // Fenzhongsi Bridge (East 5th)
        { lat: 39.935, lng: 116.525 }, // Gaobeidian
        { lat: 39.875, lng: 116.585 }, // Wufang Bridge
        { lat: 39.855, lng: 116.675 }, // Universal
    ],
    // Wangjing -> Airport via 5th + Daxing Expo
    AIRPORT: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 39.915, lng: 116.485 }, // East 5th
        { lat: 39.755, lng: 116.455 }, // Xihongmen
        { lat: 39.510, lng: 116.415 }, // Airport
    ],
    // Wangjing -> Tianjin via G2
    TIANJIN: [
        { lat: 40.003, lng: 116.475 }, // Home
        { lat: 39.915, lng: 116.485 }, // Fenzhongsi Bridge
        { lat: 39.875, lng: 116.495 }, // Shibalidian Bridge
        { lat: 39.825, lng: 116.525 }, // Dayangfang Bridge
        { lat: 39.755, lng: 116.585 }, // Majuqiao Bridge
        { lat: 39.555, lng: 116.715 }, // Langfang
        { lat: 39.215, lng: 117.155 }, // Yangcun
        { lat: 39.015, lng: 117.712 }, // Tianjin Binhai
    ]
};

function interpolateSegment(start: { lat: number, lng: number }, end: { lat: number, lng: number }, steps: number, odometerStart: number): TeslaMatePosition[] {
    const positions: TeslaMatePosition[] = [];
    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        // Jitter should be very small (centimeters/meters) to avoid road offset
        const jitterLat = (Math.random() - 0.5) * 0.0001;
        const jitterLng = (Math.random() - 0.5) * 0.0001;

        positions.push({
            date: new Date().toISOString(),
            latitude: start.lat + (end.lat - start.lat) * ratio + jitterLat,
            longitude: start.lng + (end.lng - start.lng) * ratio + jitterLng,
            speed: ratio > 0 && ratio < 1 ? 60 + Math.random() * 20 : 0,
            power: ratio > 0 && ratio < 1 ? 15 + Math.random() * 10 : 0,
            odometer: odometerStart + (i * 0.1),
            ideal_battery_range_km: 400 - (odometerStart / 1000) - ratio,
            rated_battery_range_km: 360 - (odometerStart / 1000) - ratio,
            battery_level: 80 - ratio * 2,
            elevation: 45 + Math.random() * 5,
        });
    }
    return positions;
}

function pathInterpolate(waypoints: { lat: number, lng: number }[], totalSteps: number = 30): TeslaMatePosition[] {
    const positions: TeslaMatePosition[] = [];
    const segments = waypoints.length - 1;
    const stepsPerSegment = Math.max(1, Math.floor(totalSteps / segments));

    let currentOdometer = 12000 + Math.random() * 1000;

    for (let i = 0; i < segments; i++) {
        const segmentPositions = interpolateSegment(waypoints[i]!, waypoints[i + 1]!, stepsPerSegment, currentOdometer);
        positions.push(...segmentPositions.slice(0, -1)); // avoid doubling waypoints
        currentOdometer = segmentPositions[segmentPositions.length - 1]!.odometer;
    }

    // Add final point
    const final = waypoints[waypoints.length - 1]!;
    positions.push({
        date: new Date().toISOString(),
        latitude: final.lat,
        longitude: final.lng,
        speed: 0,
        power: 0,
        odometer: currentOdometer,
        ideal_battery_range_km: 400 - (currentOdometer / 1000),
        rated_battery_range_km: 360 - (currentOdometer / 1000),
        battery_level: 70,
        elevation: 45,
    });

    return positions;
}

async function main() {
    console.log("🌱 Seeding 20 realistic TeslaMate drives...");

    const now = new Date();
    const drives: TeslaMateDrive[] = [];

    // 1. Commutes (10 drives: 5 days x 2)
    for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (i + 1)); // Last 5 Mon-Fri

        // Morning commute
        const morningStart = new Date(date);
        morningStart.setHours(8, 30 + Math.floor(Math.random() * 30), 0);
        const morningEnd = new Date(morningStart.getTime() + (40 + Math.floor(Math.random() * 20)) * 60000);

        drives.push({
            id: 2000 + i * 2,
            start_date: morningStart.toISOString(),
            end_date: morningEnd.toISOString(),
            start_address: LOCATIONS.HOME.name,
            end_address: LOCATIONS.OFFICE.name,
            distance: 18.2,
            duration_min: 45,
            speed_max: 92,
            power_max: 75,
            power_min: -30,
            start_rated_range_km: 380,
            end_rated_range_km: 362,
            start_ideal_range_km: 420,
            end_ideal_range_km: 402,
            outside_temp_avg: 12,
            inside_temp_avg: 22,
            positions: pathInterpolate(PATHS.COMMUTE, 30),
        });

        // Evening commute
        const eveningStart = new Date(date);
        eveningStart.setHours(18, 0 + Math.floor(Math.random() * 60), 0);
        const eveningEnd = new Date(eveningStart.getTime() + (50 + Math.floor(Math.random() * 30)) * 60000);

        drives.push({
            id: 2000 + i * 2 + 1,
            start_date: eveningStart.toISOString(),
            end_date: eveningEnd.toISOString(),
            start_address: LOCATIONS.OFFICE.name,
            end_address: LOCATIONS.HOME.name,
            distance: 18.5,
            duration_min: 55,
            speed_max: 88,
            power_max: 80,
            power_min: -35,
            start_rated_range_km: 340,
            end_rated_range_km: 322,
            start_ideal_range_km: 380,
            end_ideal_range_km: 362,
            outside_temp_avg: 10,
            inside_temp_avg: 22,
            positions: pathInterpolate([...PATHS.COMMUTE].reverse(), 30),
        });
    }

    // 2. Weekend Trips (4 drives)
    const weekend1 = new Date(now);
    weekend1.setDate(now.getDate() - (now.getDay() + 1)); // Last Sat

    // Sat: Home -> Mall
    drives.push({
        id: 2011,
        start_date: new Date(weekend1.setHours(11, 0)).toISOString(),
        end_date: new Date(weekend1.setHours(11, 30)).toISOString(),
        start_address: LOCATIONS.HOME.name,
        end_address: LOCATIONS.MALL.name,
        distance: 7.5,
        duration_min: 30,
        speed_max: 60,
        power_max: 40,
        power_min: -10,
        start_rated_range_km: 300,
        end_rated_range_km: 292,
        start_ideal_range_km: 340,
        end_ideal_range_km: 332,
        outside_temp_avg: 15,
        inside_temp_avg: 21,
        positions: pathInterpolate(PATHS.MALL, 15),
    });

    // Sat: Mall -> Home
    drives.push({
        id: 2012,
        start_date: new Date(weekend1.setHours(16, 0)).toISOString(),
        end_date: new Date(weekend1.setHours(16, 40)).toISOString(),
        start_address: LOCATIONS.MALL.name,
        end_address: LOCATIONS.HOME.name,
        distance: 7.8,
        duration_min: 40,
        speed_max: 65,
        power_max: 45,
        power_min: -15,
        start_rated_range_km: 290,
        end_rated_range_km: 282,
        start_ideal_range_km: 330,
        end_ideal_range_km: 322,
        outside_temp_avg: 14,
        inside_temp_avg: 22,
        positions: pathInterpolate([...PATHS.MALL].reverse(), 15),
    });

    const weekend2 = new Date(now);
    weekend2.setDate(now.getDate() - now.getDay()); // Last Sun

    // Sun: Home -> Sanlitun
    drives.push({
        id: 2013,
        start_date: new Date(weekend2.setHours(14, 0)).toISOString(),
        end_date: new Date(weekend2.setHours(14, 45)).toISOString(),
        start_address: LOCATIONS.HOME.name,
        end_address: LOCATIONS.SANLITUN.name,
        distance: 10.2,
        duration_min: 45,
        speed_max: 55,
        power_max: 35,
        power_min: -10,
        start_rated_range_km: 270,
        end_rated_range_km: 260,
        start_ideal_range_km: 310,
        end_ideal_range_km: 300,
        outside_temp_avg: 18,
        inside_temp_avg: 21,
        positions: pathInterpolate(PATHS.SHOPPING, 15),
    });

    // Sun: Sanlitun -> Home
    drives.push({
        id: 2014,
        start_date: new Date(weekend2.setHours(21, 0)).toISOString(),
        end_date: new Date(weekend2.setHours(21, 30)).toISOString(),
        start_address: LOCATIONS.SANLITUN.name,
        end_address: LOCATIONS.HOME.name,
        distance: 9.8,
        duration_min: 30,
        speed_max: 70,
        power_max: 50,
        power_min: -20,
        start_rated_range_km: 250,
        end_rated_range_km: 240,
        start_ideal_range_km: 290,
        end_ideal_range_km: 280,
        outside_temp_avg: 12,
        inside_temp_avg: 22,
        positions: pathInterpolate([...PATHS.SHOPPING].reverse(), 15),
    });

    // 3. Long Trips (2 drives)
    const longTripDate = new Date(now);
    longTripDate.setDate(now.getDate() - 15);

    // Home -> Universal
    drives.push({
        id: 2015,
        start_date: new Date(longTripDate.setHours(9, 0)).toISOString(),
        end_date: new Date(longTripDate.setHours(10, 15)).toISOString(),
        start_address: LOCATIONS.HOME.name,
        end_address: LOCATIONS.UNIVERSAL.name,
        distance: 35.5,
        duration_min: 75,
        speed_max: 105,
        power_max: 120,
        power_min: -40,
        start_rated_range_km: 450,
        end_rated_range_km: 410,
        start_ideal_range_km: 510,
        end_ideal_range_km: 470,
        outside_temp_avg: 10,
        inside_temp_avg: 22,
        positions: pathInterpolate(PATHS.UNIVERSAL, 40),
    });

    // Universal -> Home
    drives.push({
        id: 2016,
        start_date: new Date(longTripDate.setHours(20, 0)).toISOString(),
        end_date: new Date(longTripDate.setHours(21, 30)).toISOString(),
        start_address: LOCATIONS.UNIVERSAL.name,
        end_address: LOCATIONS.HOME.name,
        distance: 36.2,
        duration_min: 90,
        speed_max: 95,
        power_max: 90,
        power_min: -30,
        start_rated_range_km: 400,
        end_rated_range_km: 360,
        start_ideal_range_km: 460,
        end_ideal_range_km: 420,
        outside_temp_avg: 8,
        inside_temp_avg: 22,
        positions: pathInterpolate([...PATHS.UNIVERSAL].reverse(), 40),
    });

    // 4. Inter-city / Airport (4 drives)
    const airportDate = new Date(now);
    airportDate.setDate(now.getDate() - 22);

    // Home -> Airport
    drives.push({
        id: 2017,
        start_date: new Date(airportDate.setHours(5, 0)).toISOString(),
        end_date: new Date(airportDate.setHours(6, 15)).toISOString(),
        start_address: LOCATIONS.HOME.name,
        end_address: LOCATIONS.AIRPORT.name,
        distance: 65.4,
        duration_min: 75,
        speed_max: 120,
        power_max: 140,
        power_min: -50,
        start_rated_range_km: 480,
        end_rated_range_km: 410,
        start_ideal_range_km: 550,
        end_ideal_range_km: 480,
        outside_temp_avg: 5,
        inside_temp_avg: 23,
        positions: pathInterpolate(PATHS.AIRPORT, 50),
    });

    // Airport -> Home (returning a few days later)
    const returnDate = new Date(airportDate);
    returnDate.setDate(airportDate.getDate() + 3);
    drives.push({
        id: 2018,
        start_date: new Date(returnDate.setHours(22, 0)).toISOString(),
        end_date: new Date(returnDate.setHours(23, 15)).toISOString(),
        start_address: LOCATIONS.AIRPORT.name,
        end_address: LOCATIONS.HOME.name,
        distance: 66.8,
        duration_min: 75,
        speed_max: 125,
        power_max: 150,
        power_min: -60,
        start_rated_range_km: 350,
        end_rated_range_km: 280,
        start_ideal_range_km: 410,
        end_ideal_range_km: 340,
        outside_temp_avg: 3,
        inside_temp_avg: 23,
        positions: pathInterpolate([...PATHS.AIRPORT].reverse(), 50),
    });

    // Home -> Tianjin (One variant)
    const tianjinDate = new Date(now);
    tianjinDate.setDate(now.getDate() - 40);
    drives.push({
        id: 2019,
        start_date: new Date(tianjinDate.setHours(10, 0)).toISOString(),
        end_date: new Date(tianjinDate.setHours(12, 30)).toISOString(),
        start_address: LOCATIONS.HOME.name,
        end_address: LOCATIONS.TIANJIN.name,
        distance: 145.2,
        duration_min: 150,
        speed_max: 120,
        power_max: 160,
        power_min: -80,
        start_rated_range_km: 450,
        end_rated_range_km: 280,
        start_ideal_range_km: 520,
        end_ideal_range_km: 350,
        outside_temp_avg: 12,
        inside_temp_avg: 22,
        positions: pathInterpolate(PATHS.TIANJIN, 100),
    });

    // Tianjin -> Home
    drives.push({
        id: 2020,
        start_date: new Date(tianjinDate.setHours(18, 0)).toISOString(),
        end_date: new Date(tianjinDate.setHours(20, 30)).toISOString(),
        start_address: LOCATIONS.TIANJIN.name,
        end_address: LOCATIONS.HOME.name,
        distance: 142.8,
        duration_min: 150,
        speed_max: 115,
        power_max: 150,
        power_min: -70,
        start_rated_range_km: 260,
        end_rated_range_km: 105,
        start_ideal_range_km: 320,
        end_ideal_range_km: 165,
        outside_temp_avg: 8,
        inside_temp_avg: 22,
        positions: pathInterpolate([...PATHS.TIANJIN].reverse(), 100),
    });

    // Save to database
    for (const drive of drives) {
        const footprint = TeslaMateClient.driveToFootprint(drive);

        // Use upsert to avoid duplicates if run multiple times
        await prisma.footprint.upsert({
            where: {
                // Since we don't have a unique ID in Prisma for external IDs yet, 
                // we'll match by startTime and title
                id: `teslamate-${drive.id}`
            },
            update: {
                ...footprint,
                id: `teslamate-${drive.id}`,
                metadata: footprint.metadata as any,
            },
            create: {
                ...footprint,
                id: `teslamate-${drive.id}`,
                metadata: footprint.metadata as any,
            },
        });
    }

    console.log(`✅ Seeded ${drives.length} human-like drives.`);

    // Refresh cities
    console.log("🏙️ Refreshing city visits...");
    await syncCitiesFromFootprints();

    // Refresh achievements
    console.log("🏆 Updating achievement progress...");
    await updateAchievementProgress();

    console.log("✨ All done!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
