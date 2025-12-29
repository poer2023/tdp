"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
    Footprints,
    Car,
    Bike,
    Plane,
    MapPin,
    Clock,
    ArrowRight,
    Upload,
} from "lucide-react";
import type { Footprint, FootprintStats, FootprintType } from "@/lib/footprint/footprint";
import { TimelineFilter } from "./timeline-filter";
import { AnnualReport } from "./annual-report";
import { AchievementsList } from "./achievements-list";
import { TeslaMateSync } from "./teslamate-sync";

// Dynamically import map to avoid SSR issues
const FootprintMap = dynamic(
    () => import("./footprint-map").then((mod) => mod.FootprintMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
                <div className="flex gap-1">
                    <span className="size-2 animate-pulse rounded-full bg-stone-400" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
                </div>
            </div>
        ),
    }
);

interface FootprintDashboardProps {
    stats: FootprintStats;
    recentFootprints: Footprint[];
    polylines: Array<{
        id: string;
        type: FootprintType;
        polyline: string;
        startTime: Date;
    }>;
    locale: "zh" | "en";
}

interface FlyToTarget {
    type: 'polyline' | 'point';
    id: string;
    lat?: number;
    lng?: number;
}

const typeIcons: Record<FootprintType, React.ReactNode> = {
    WALK: <Footprints className="h-4 w-4" />,
    RUN: <Footprints className="h-4 w-4" />,
    BIKE: <Bike className="h-4 w-4" />,
    DRIVE: <Car className="h-4 w-4" />,
    TRANSIT: <Car className="h-4 w-4" />,
    FLIGHT: <Plane className="h-4 w-4" />,
    OTHER: <MapPin className="h-4 w-4" />,
};

const typeColors: Record<FootprintType, string> = {
    WALK: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    RUN: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    BIKE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    DRIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    TRANSIT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    FLIGHT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    OTHER: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400",
};

function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 100) return `${km.toFixed(1)}km`;
    return `${Math.round(km).toLocaleString()}km`;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export function FootprintDashboard({
    stats,
    recentFootprints,
    polylines,
    locale,
}: FootprintDashboardProps) {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [flyToMap, setFlyToMap] = useState<((target: FlyToTarget) => void) | null>(null);
    const [filterYear, setFilterYear] = useState<number | null>(null);
    const [filterMonth, setFilterMonth] = useState<number | null>(null);

    const handleFilterChange = useCallback((year: number | null, month: number | null) => {
        setFilterYear(year);
        setFilterMonth(month);
    }, []);

    // Filter footprints by year/month
    const filteredFootprints = useMemo(() => {
        if (!filterYear) return recentFootprints;
        return recentFootprints.filter((fp) => {
            const date = new Date(fp.startTime);
            if (date.getFullYear() !== filterYear) return false;
            if (filterMonth && date.getMonth() + 1 !== filterMonth) return false;
            return true;
        });
    }, [recentFootprints, filterYear, filterMonth]);

    // Filter polylines by year/month
    const filteredPolylines = useMemo(() => {
        if (!filterYear) return polylines;
        return polylines.filter((p) => {
            const date = new Date(p.startTime);
            if (date.getFullYear() !== filterYear) return false;
            if (filterMonth && date.getMonth() + 1 !== filterMonth) return false;
            return true;
        });
    }, [polylines, filterYear, filterMonth]);

    const handleMapReady = useCallback((flyTo: (target: FlyToTarget) => void) => {
        setFlyToMap(() => flyTo);
    }, []);

    const handleTripClick = (footprint: Footprint) => {
        setSelectedId(footprint.id);

        // Check if this footprint has a polyline
        const hasPolyline = polylines.some((p) => p.id === footprint.id);

        if (flyToMap) {
            if (hasPolyline) {
                flyToMap({ type: 'polyline', id: footprint.id });
            } else if (footprint.startLat && footprint.startLng) {
                flyToMap({
                    type: 'point',
                    id: footprint.id,
                    lat: footprint.startLat,
                    lng: footprint.startLng
                });
            }
        }
    };

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: "足迹",
                subtitle: "历史行程轨迹",
                totalTrips: "总行程",
                totalDistance: "总里程",
                totalDuration: "总时长",
                cities: "城市",
                recentTrips: "最近行程",
                importGPX: "导入 GPX",
                noData: "暂无足迹数据",
                noDataHint: "上传 GPX 文件开始记录你的足迹",
                walk: "步行",
                run: "跑步",
                bike: "骑行",
                drive: "驾驶",
                transit: "公交",
                flight: "飞行",
                other: "其他",
            },
            en: {
                title: "Footprint",
                subtitle: "Travel tracks",
                totalTrips: "Total Trips",
                totalDistance: "Total Distance",
                totalDuration: "Total Duration",
                cities: "Cities",
                recentTrips: "Recent Trips",
                importGPX: "Import GPX",
                noData: "No footprint data yet",
                noDataHint: "Upload GPX files to start tracking your footprint",
                walk: "Walk",
                run: "Run",
                bike: "Bike",
                drive: "Drive",
                transit: "Transit",
                flight: "Flight",
                other: "Other",
            },
        };
        return translations[locale]?.[key] || key;
    };

    const typeLabels: Record<FootprintType, string> = {
        WALK: t("walk"),
        RUN: t("run"),
        BIKE: t("bike"),
        DRIVE: t("drive"),
        TRANSIT: t("transit"),
        FLIGHT: t("flight"),
        OTHER: t("other"),
    };

    const hasData = stats.totalTrips > 0;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {t("title")}
                    </h1>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        {t("subtitle")}
                    </p>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 rounded-full bg-sage-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-sage-600 hover:shadow"
                >
                    <Upload className="h-4 w-4" />
                    {t("importGPX")}
                </button>
            </div>

            {hasData ? (
                <>
                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            icon={<Footprints className="h-5 w-5" />}
                            label={t("totalTrips")}
                            value={stats.totalTrips.toString()}
                            color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        />
                        <StatCard
                            icon={<MapPin className="h-5 w-5" />}
                            label={t("totalDistance")}
                            value={formatDistance(stats.totalDistance)}
                            color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        />
                        <StatCard
                            icon={<Clock className="h-5 w-5" />}
                            label={t("totalDuration")}
                            value={formatDuration(stats.totalDuration)}
                            color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        />
                        <StatCard
                            icon={<MapPin className="h-5 w-5" />}
                            label={t("cities")}
                            value={stats.citiesVisited.toString()}
                            color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        />
                    </div>

                    {/* TeslaMate Sync */}
                    <div className="mb-6">
                        <TeslaMateSync locale={locale} />
                    </div>

                    {/* Timeline Filter */}
                    <div className="mb-6">
                        <TimelineFilter onFilterChange={handleFilterChange} locale={locale} />
                    </div>

                    {/* Map */}
                    <div className="mb-8">
                        <FootprintMap
                            polylines={filteredPolylines}
                            selectedId={selectedId}
                            onMapReady={handleMapReady}
                        />
                    </div>

                    {/* Recent Trips */}
                    <div>
                        <h2 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
                            {t("recentTrips")}
                        </h2>
                        <div className="space-y-3">
                            {filteredFootprints.map((footprint) => {
                                const isSelected = selectedId === footprint.id;

                                return (
                                    <div
                                        key={footprint.id}
                                        onClick={() => handleTripClick(footprint)}
                                        className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all dark:bg-stone-800 cursor-pointer hover:shadow-md ${isSelected ? "ring-2 ring-sage-500" : ""}`}
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full ${typeColors[footprint.type]}`}
                                        >
                                            {typeIcons[footprint.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-stone-900 dark:text-stone-100 truncate">
                                                    {footprint.title || typeLabels[footprint.type]}
                                                </span>
                                                <span className="text-xs text-stone-400 dark:text-stone-500">
                                                    {new Date(footprint.startTime).toLocaleDateString(
                                                        locale === "zh" ? "zh-CN" : "en-US"
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                                                {footprint.startAddr && footprint.endAddr && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        {footprint.startAddr}
                                                        <ArrowRight className="h-3 w-3" />
                                                        {footprint.endAddr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {footprint.distance && (
                                                <div className="font-medium text-stone-900 dark:text-stone-100">
                                                    {formatDistance(footprint.distance)}
                                                </div>
                                            )}
                                            {footprint.duration && (
                                                <div className="text-xs text-stone-500 dark:text-stone-400">
                                                    {formatDuration(footprint.duration)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Annual Report & Achievements */}
                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <AnnualReport locale={locale} />
                        <AchievementsList locale={locale} />
                    </div>
                </>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-stone-800">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700">
                        <MapPin className="h-8 w-8 text-stone-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {t("noData")}
                    </h3>
                    <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                        {t("noDataHint")}
                    </p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 rounded-full bg-sage-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-sage-600 hover:shadow"
                    >
                        <Upload className="h-4 w-4" />
                        {t("importGPX")}
                    </button>
                </div>
            )}

            {/* Upload Modal (to be implemented) */}
            {showUpload && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowUpload(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
                            {t("importGPX")}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            GPX 导入功能开发中...
                        </p>
                        <button
                            onClick={() => setShowUpload(false)}
                            className="mt-4 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-stone-800">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {value}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{label}</div>
        </div>
    );
}
