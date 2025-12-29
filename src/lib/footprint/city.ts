/**
 * City data layer for footprint city markers
 */

import { prisma } from "@/lib/prisma";

export interface CityData {
    id: string;
    code: string;
    name: string;
    nameEn: string | null;
    lat: number;
    lng: number;
    visits: number;
    firstVisit: Date | null;
    lastVisit: Date | null;
}

/**
 * Get all visited cities
 */
export async function getVisitedCities(): Promise<CityData[]> {
    return prisma.city.findMany({
        where: { visits: { gt: 0 } },
        orderBy: { visits: "desc" },
    });
}

/**
 * Get city by code
 */
export async function getCityByCode(code: string): Promise<CityData | null> {
    return prisma.city.findUnique({ where: { code } });
}

/**
 * Update or create city visit record
 */
export async function recordCityVisit(
    code: string,
    name: string,
    lat: number,
    lng: number,
    visitTime: Date,
    nameEn?: string
): Promise<CityData> {
    return prisma.city.upsert({
        where: { code },
        create: {
            code,
            name,
            nameEn,
            lat,
            lng,
            visits: 1,
            firstVisit: visitTime,
            lastVisit: visitTime,
        },
        update: {
            visits: { increment: 1 },
            lastVisit: visitTime,
            // Only update firstVisit if null
            firstVisit: undefined, // Will be handled by raw query if needed
        },
    });
}

/**
 * Major Chinese cities with coordinates
 * Used for reverse geocoding fallback
 */
export const MAJOR_CITIES: Record<string, { name: string; nameEn: string; lat: number; lng: number }> = {
    "CN-BJ": { name: "北京", nameEn: "Beijing", lat: 39.9042, lng: 116.4074 },
    "CN-SH": { name: "上海", nameEn: "Shanghai", lat: 31.2304, lng: 121.4737 },
    "CN-GZ": { name: "广州", nameEn: "Guangzhou", lat: 23.1291, lng: 113.2644 },
    "CN-SZ": { name: "深圳", nameEn: "Shenzhen", lat: 22.5431, lng: 114.0579 },
    "CN-HZ": { name: "杭州", nameEn: "Hangzhou", lat: 30.2741, lng: 120.1551 },
    "CN-NJ": { name: "南京", nameEn: "Nanjing", lat: 32.0603, lng: 118.7969 },
    "CN-CD": { name: "成都", nameEn: "Chengdu", lat: 30.5728, lng: 104.0668 },
    "CN-WH": { name: "武汉", nameEn: "Wuhan", lat: 30.5928, lng: 114.3055 },
    "CN-XA": { name: "西安", nameEn: "Xi'an", lat: 34.3416, lng: 108.9398 },
    "CN-CQ": { name: "重庆", nameEn: "Chongqing", lat: 29.4316, lng: 106.9123 },
    "CN-TJ": { name: "天津", nameEn: "Tianjin", lat: 39.3434, lng: 117.3616 },
    "CN-SY": { name: "沈阳", nameEn: "Shenyang", lat: 41.8057, lng: 123.4315 },
    "CN-DL": { name: "大连", nameEn: "Dalian", lat: 38.9140, lng: 121.6147 },
    "CN-QD": { name: "青岛", nameEn: "Qingdao", lat: 36.0671, lng: 120.3826 },
    "CN-XM": { name: "厦门", nameEn: "Xiamen", lat: 24.4798, lng: 118.0894 },
    "CN-SZ2": { name: "苏州", nameEn: "Suzhou", lat: 31.2990, lng: 120.5853 },
    "CN-ZZ": { name: "郑州", nameEn: "Zhengzhou", lat: 34.7466, lng: 113.6254 },
    "CN-CS": { name: "长沙", nameEn: "Changsha", lat: 28.2282, lng: 112.9388 },
    "CN-KM": { name: "昆明", nameEn: "Kunming", lat: 24.8801, lng: 102.8329 },
    "CN-HRB": { name: "哈尔滨", nameEn: "Harbin", lat: 45.8038, lng: 126.5350 },
};

/**
 * Find nearest city from coordinates (simple distance check)
 */
export function findNearestCity(lat: number, lng: number): { code: string; city: typeof MAJOR_CITIES[string] } | null {
    let nearestCode: string | null = null;
    let minDistance = Infinity;

    for (const [code, city] of Object.entries(MAJOR_CITIES)) {
        const distance = Math.sqrt(
            Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
        );
        // Within ~100km radius (roughly 1 degree)
        if (distance < 1 && distance < minDistance) {
            minDistance = distance;
            nearestCode = code;
        }
    }

    if (!nearestCode) return null;
    const city = MAJOR_CITIES[nearestCode];
    if (!city) return null;
    return { code: nearestCode, city };
}

/**
 * Sync cities from existing footprints
 */
export async function syncCitiesFromFootprints(): Promise<number> {
    const footprints = await prisma.footprint.findMany({
        select: { startLat: true, startLng: true, startTime: true },
        where: { startLat: { not: null }, startLng: { not: null } },
    });

    const cityVisits = new Map<string, { count: number; earliest: Date; latest: Date }>();

    for (const fp of footprints) {
        if (!fp.startLat || !fp.startLng) continue;

        const match = findNearestCity(fp.startLat, fp.startLng);
        if (!match) continue;

        const existing = cityVisits.get(match.code);
        if (existing) {
            existing.count++;
            if (fp.startTime < existing.earliest) existing.earliest = fp.startTime;
            if (fp.startTime > existing.latest) existing.latest = fp.startTime;
        } else {
            cityVisits.set(match.code, {
                count: 1,
                earliest: fp.startTime,
                latest: fp.startTime,
            });
        }
    }

    // Upsert all cities
    for (const [code, data] of cityVisits) {
        const cityInfo = MAJOR_CITIES[code];
        if (!cityInfo) continue;

        await prisma.city.upsert({
            where: { code },
            create: {
                code,
                name: cityInfo.name,
                nameEn: cityInfo.nameEn,
                lat: cityInfo.lat,
                lng: cityInfo.lng,
                visits: data.count,
                firstVisit: data.earliest,
                lastVisit: data.latest,
            },
            update: {
                visits: data.count,
                firstVisit: data.earliest,
                lastVisit: data.latest,
            },
        });
    }

    return cityVisits.size;
}
