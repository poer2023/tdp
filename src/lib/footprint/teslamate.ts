/**
 * TeslaMate API Client
 * Connects to local TeslaMate API (default port 4000) to fetch drive data
 */

import { encodePolyline } from "./gpx-parser";

// Types based on TeslaMate API response
export interface TeslaMatePosition {
    date: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    power: number | null;
    odometer: number;
    ideal_battery_range_km: number | null;
    rated_battery_range_km: number | null;
    battery_level: number | null;
    elevation: number | null;
}

export interface TeslaMateDrive {
    id: number;
    start_date: string;
    end_date: string;
    start_address: string | null;
    end_address: string | null;
    distance: number; // km
    duration_min: number;
    speed_max: number | null;
    power_max: number | null;
    power_min: number | null;
    start_ideal_range_km: number | null;
    end_ideal_range_km: number | null;
    start_rated_range_km: number | null;
    end_rated_range_km: number | null;
    outside_temp_avg: number | null;
    inside_temp_avg: number | null;
    positions?: TeslaMatePosition[];
}

export interface TeslaMateConfig {
    baseUrl: string;
    carId: number;
    apiToken?: string;
}

const DEFAULT_CONFIG: TeslaMateConfig = {
    baseUrl: process.env.TESLAMATE_API_URL || "http://localhost:4000",
    carId: parseInt(process.env.TESLAMATE_CAR_ID || "1"),
    apiToken: process.env.TESLAMATE_API_TOKEN,
};

/**
 * TeslaMate API Client
 */
export class TeslaMateClient {
    private config: TeslaMateConfig;

    constructor(config?: Partial<TeslaMateConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    private async fetch<T>(endpoint: string): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (this.config.apiToken) {
            headers["Authorization"] = `Bearer ${this.config.apiToken}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`TeslaMate API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get all drives for the car
     */
    async getDrives(options?: {
        startDate?: Date;
        endDate?: Date;
        minDistance?: number;
    }): Promise<TeslaMateDrive[]> {
        let endpoint = `/api/v1/cars/${this.config.carId}/drives`;

        const params = new URLSearchParams();
        if (options?.startDate) {
            params.set("startDate", options.startDate.toISOString());
        }
        if (options?.endDate) {
            params.set("endDate", options.endDate.toISOString());
        }
        if (options?.minDistance) {
            params.set("minDistance", options.minDistance.toString());
        }

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        return this.fetch<TeslaMateDrive[]>(endpoint);
    }

    /**
     * Get a single drive with positions
     */
    async getDrive(driveId: number): Promise<TeslaMateDrive> {
        return this.fetch<TeslaMateDrive>(`/api/v1/cars/${this.config.carId}/drives/${driveId}`);
    }

    /**
     * Convert TeslaMate drive to Footprint format
     */
    static driveToFootprint(drive: TeslaMateDrive): {
        type: "DRIVE";
        source: "TESLAMATE";
        title: string;
        startTime: Date;
        endTime: Date;
        distance: number;
        duration: number;
        polyline: string | null;
        startLat: number | null;
        startLng: number | null;
        endLat: number | null;
        endLng: number | null;
        startAddr: string | null;
        endAddr: string | null;
        metadata: Record<string, unknown>;
    } {
        // Generate title
        const startAddr = drive.start_address || "未知地点";
        const endAddr = drive.end_address || "未知地点";
        const title = `${startAddr} → ${endAddr}`;

        // Generate polyline from positions
        let polyline: string | null = null;
        let startLat: number | null = null;
        let startLng: number | null = null;
        let endLat: number | null = null;
        let endLng: number | null = null;

        if (drive.positions && drive.positions.length > 0) {
            const points = drive.positions.map((p) => ({
                lat: p.latitude,
                lon: p.longitude,
            }));
            polyline = encodePolyline(points);

            startLat = drive.positions[0]?.latitude ?? null;
            startLng = drive.positions[0]?.longitude ?? null;
            const lastPos = drive.positions[drive.positions.length - 1];
            endLat = lastPos?.latitude ?? null;
            endLng = lastPos?.longitude ?? null;
        }

        return {
            type: "DRIVE",
            source: "TESLAMATE",
            title,
            startTime: new Date(drive.start_date),
            endTime: new Date(drive.end_date),
            distance: drive.distance,
            duration: drive.duration_min * 60, // Convert to seconds
            polyline,
            startLat,
            startLng,
            endLat,
            endLng,
            startAddr: drive.start_address,
            endAddr: drive.end_address,
            metadata: {
                speedMax: drive.speed_max,
                powerMax: drive.power_max,
                powerMin: drive.power_min,
                startRatedRange: drive.start_rated_range_km,
                endRatedRange: drive.end_rated_range_km,
                outsideTempAvg: drive.outside_temp_avg,
                insideTempAvg: drive.inside_temp_avg,
                energyUsed: drive.start_rated_range_km && drive.end_rated_range_km
                    ? drive.start_rated_range_km - drive.end_rated_range_km
                    : null,
            },
        };
    }
}

/**
 * Mock TeslaMate data for development/testing
 */
export function getMockTeslaMateDrives(): TeslaMateDrive[] {
    const now = new Date();

    return [
        {
            id: 1001,
            start_date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
            end_date: new Date(now.getTime() - 2 * 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
            start_address: "北京市朝阳区望京SOHO",
            end_address: "北京市海淀区中关村软件园",
            distance: 18.5,
            duration_min: 45,
            speed_max: 95,
            power_max: 85,
            power_min: -45,
            start_rated_range_km: 380,
            end_rated_range_km: 355,
            start_ideal_range_km: 420,
            end_ideal_range_km: 395,
            outside_temp_avg: 8,
            inside_temp_avg: 22,
            positions: [
                { date: "", latitude: 39.9920, longitude: 116.4736, speed: 0, power: 0, odometer: 12500, ideal_battery_range_km: 420, rated_battery_range_km: 380, battery_level: 85, elevation: 48 },
                { date: "", latitude: 39.9950, longitude: 116.4650, speed: 45, power: 35, odometer: 12502, ideal_battery_range_km: 418, rated_battery_range_km: 378, battery_level: 84, elevation: 50 },
                { date: "", latitude: 39.9980, longitude: 116.4500, speed: 60, power: 45, odometer: 12505, ideal_battery_range_km: 415, rated_battery_range_km: 375, battery_level: 83, elevation: 52 },
                { date: "", latitude: 40.0050, longitude: 116.4300, speed: 80, power: 65, odometer: 12510, ideal_battery_range_km: 410, rated_battery_range_km: 370, battery_level: 82, elevation: 55 },
                { date: "", latitude: 40.0150, longitude: 116.4000, speed: 75, power: 55, odometer: 12515, ideal_battery_range_km: 405, rated_battery_range_km: 365, battery_level: 80, elevation: 58 },
                { date: "", latitude: 40.0300, longitude: 116.3600, speed: 60, power: 40, odometer: 12518, ideal_battery_range_km: 398, rated_battery_range_km: 358, battery_level: 79, elevation: 55 },
                { date: "", latitude: 40.0420, longitude: 116.3280, speed: 40, power: 25, odometer: 12518, ideal_battery_range_km: 395, rated_battery_range_km: 355, battery_level: 78, elevation: 52 },
            ],
        },
        {
            id: 1002,
            start_date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
            end_date: new Date(now.getTime() - 5 * 24 * 3600 * 1000 + 120 * 60 * 1000).toISOString(),
            start_address: "北京市朝阳区望京SOHO",
            end_address: "天津市滨海新区",
            distance: 135.2,
            duration_min: 120,
            speed_max: 120,
            power_max: 150,
            power_min: -75,
            start_rated_range_km: 420,
            end_rated_range_km: 285,
            start_ideal_range_km: 460,
            end_ideal_range_km: 315,
            outside_temp_avg: 5,
            inside_temp_avg: 23,
            positions: [
                { date: "", latitude: 39.9920, longitude: 116.4736, speed: 0, power: 0, odometer: 12400, ideal_battery_range_km: 460, rated_battery_range_km: 420, battery_level: 95, elevation: 48 },
                { date: "", latitude: 39.9500, longitude: 116.5500, speed: 80, power: 75, odometer: 12410, ideal_battery_range_km: 450, rated_battery_range_km: 410, battery_level: 92, elevation: 40 },
                { date: "", latitude: 39.8800, longitude: 116.7000, speed: 110, power: 120, odometer: 12430, ideal_battery_range_km: 430, rated_battery_range_km: 390, battery_level: 88, elevation: 25 },
                { date: "", latitude: 39.7500, longitude: 116.9000, speed: 120, power: 140, odometer: 12460, ideal_battery_range_km: 400, rated_battery_range_km: 360, battery_level: 82, elevation: 15 },
                { date: "", latitude: 39.5500, longitude: 117.1500, speed: 115, power: 130, odometer: 12490, ideal_battery_range_km: 370, rated_battery_range_km: 330, battery_level: 75, elevation: 10 },
                { date: "", latitude: 39.3500, longitude: 117.3500, speed: 100, power: 100, odometer: 12510, ideal_battery_range_km: 345, rated_battery_range_km: 305, battery_level: 70, elevation: 5 },
                { date: "", latitude: 39.1000, longitude: 117.5500, speed: 60, power: 50, odometer: 12535, ideal_battery_range_km: 315, rated_battery_range_km: 285, battery_level: 65, elevation: 3 },
            ],
        },
        {
            id: 1003,
            start_date: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
            end_date: new Date(now.getTime() - 10 * 24 * 3600 * 1000 + 25 * 60 * 1000).toISOString(),
            start_address: "北京市朝阳区国贸CBD",
            end_address: "北京市东城区故宫",
            distance: 8.3,
            duration_min: 25,
            speed_max: 50,
            power_max: 45,
            power_min: -35,
            start_rated_range_km: 350,
            end_rated_range_km: 342,
            start_ideal_range_km: 385,
            end_ideal_range_km: 377,
            outside_temp_avg: 12,
            inside_temp_avg: 21,
            positions: [
                { date: "", latitude: 39.9087, longitude: 116.4600, speed: 0, power: 0, odometer: 12300, ideal_battery_range_km: 385, rated_battery_range_km: 350, battery_level: 78, elevation: 45 },
                { date: "", latitude: 39.9100, longitude: 116.4450, speed: 30, power: 25, odometer: 12302, ideal_battery_range_km: 383, rated_battery_range_km: 348, battery_level: 77, elevation: 46 },
                { date: "", latitude: 39.9150, longitude: 116.4300, speed: 45, power: 35, odometer: 12305, ideal_battery_range_km: 380, rated_battery_range_km: 345, battery_level: 77, elevation: 47 },
                { date: "", latitude: 39.9180, longitude: 116.4100, speed: 40, power: 30, odometer: 12307, ideal_battery_range_km: 378, rated_battery_range_km: 343, battery_level: 76, elevation: 48 },
                { date: "", latitude: 39.9170, longitude: 116.3970, speed: 20, power: 15, odometer: 12308, ideal_battery_range_km: 377, rated_battery_range_km: 342, battery_level: 76, elevation: 48 },
            ],
        },
    ];
}
