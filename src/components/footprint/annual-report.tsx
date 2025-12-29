"use client";

import { useState, useEffect } from "react";
import {
    MapPin,
    Route,
    Clock,
    Trophy,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Footprints,
    Car,
    Bike,
} from "lucide-react";

interface ReportData {
    year: number;
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    citiesCount: number;
    topCities: { name: string; visits: number }[];
    typeBreakdown: { type: string; trips: number; distance: number }[];
    longestTrip: { title: string | null; distance: number; date: string } | null;
    mostActiveMonth: { month: number; trips: number } | null;
    avgTripsPerWeek: number;
}

interface AnnualReportProps {
    locale: "zh" | "en";
}

const monthNames = {
    zh: ["", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    en: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const typeIcons: Record<string, React.ReactNode> = {
    WALK: <Footprints className="h-5 w-5" />,
    RUN: <Footprints className="h-5 w-5" />,
    BIKE: <Bike className="h-5 w-5" />,
    DRIVE: <Car className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
    WALK: "bg-green-500",
    RUN: "bg-orange-500",
    BIKE: "bg-cyan-500",
    DRIVE: "bg-blue-500",
    TRANSIT: "bg-purple-500",
    FLIGHT: "bg-indigo-500",
    OTHER: "bg-stone-500",
};

export function AnnualReport({ locale }: AnnualReportProps) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/footprint/report/${year}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError(locale === "zh" ? `${year}年暂无数据` : `No data for ${year}`);
                    } else {
                        throw new Error("Failed to load report");
                    }
                    setReport(null);
                    return;
                }
                const data = await res.json();
                setReport(data);
            } catch (err) {
                setError(locale === "zh" ? "加载失败" : "Failed to load");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, [year, locale]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} ${locale === "zh" ? "天" : "days"}`;
        }
        return `${hours} ${locale === "zh" ? "小时" : "hours"}`;
    };

    const slides = report ? [
        // Slide 1: Overview
        {
            title: locale === "zh" ? `${year}年度足迹` : `${year} Footprint`,
            content: (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="text-6xl font-bold text-sage-600">{report.totalTrips}</div>
                    <div className="text-lg text-stone-500">{locale === "zh" ? "次出行" : "trips"}</div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {report.totalDistance.toLocaleString()} km
                            </div>
                            <div className="text-sm text-stone-500">{locale === "zh" ? "总里程" : "distance"}</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {formatDuration(report.totalDuration)}
                            </div>
                            <div className="text-sm text-stone-500">{locale === "zh" ? "总时长" : "duration"}</div>
                        </div>
                    </div>
                </div>
            ),
            icon: <Route className="h-6 w-6" />,
        },
        // Slide 2: Cities
        {
            title: locale === "zh" ? "探索的城市" : "Cities Explored",
            content: (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <MapPin className="h-12 w-12 text-purple-500" />
                    <div className="text-5xl font-bold text-purple-600">{report.citiesCount}</div>
                    <div className="text-lg text-stone-500">{locale === "zh" ? "个城市" : "cities"}</div>
                    {report.topCities.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {report.topCities.map((city) => (
                                <span
                                    key={city.name}
                                    className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                >
                                    {city.name} ({city.visits})
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ),
            icon: <MapPin className="h-6 w-6" />,
        },
        // Slide 3: Type breakdown
        {
            title: locale === "zh" ? "出行方式" : "Travel Modes",
            content: (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-full max-w-xs space-y-3">
                        {report.typeBreakdown.map((item) => (
                            <div key={item.type} className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${typeColors[item.type] || "bg-stone-500"}`}>
                                    {typeIcons[item.type] || <Route className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-stone-900 dark:text-stone-100">{item.type}</span>
                                        <span className="text-stone-500">{item.trips} trips</span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-stone-200 dark:bg-stone-700">
                                        <div
                                            className={`h-full rounded-full ${typeColors[item.type] || "bg-stone-500"}`}
                                            style={{ width: `${(item.trips / report.totalTrips) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
            icon: <Bike className="h-6 w-6" />,
        },
        // Slide 4: Highlights
        {
            title: locale === "zh" ? "年度亮点" : "Highlights",
            content: (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    {report.longestTrip && (
                        <div className="text-center">
                            <Trophy className="mx-auto h-10 w-10 text-amber-500" />
                            <div className="mt-2 text-sm text-stone-500">
                                {locale === "zh" ? "最长单次行程" : "Longest Trip"}
                            </div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {report.longestTrip.distance.toFixed(1)} km
                            </div>
                            <div className="text-sm text-stone-400">
                                {report.longestTrip.title || report.longestTrip.date}
                            </div>
                        </div>
                    )}
                    {report.mostActiveMonth && (
                        <div className="text-center">
                            <Calendar className="mx-auto h-10 w-10 text-sage-500" />
                            <div className="mt-2 text-sm text-stone-500">
                                {locale === "zh" ? "最活跃月份" : "Most Active Month"}
                            </div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {monthNames[locale]?.[report.mostActiveMonth.month] ?? report.mostActiveMonth.month}
                            </div>
                            <div className="text-sm text-stone-400">
                                {report.mostActiveMonth.trips} {locale === "zh" ? "次出行" : "trips"}
                            </div>
                        </div>
                    )}
                    <div className="text-center">
                        <Clock className="mx-auto h-10 w-10 text-blue-500" />
                        <div className="mt-2 text-sm text-stone-500">
                            {locale === "zh" ? "平均每周" : "Avg per Week"}
                        </div>
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {report.avgTripsPerWeek} {locale === "zh" ? "次" : "trips"}
                        </div>
                    </div>
                </div>
            ),
            icon: <Trophy className="h-6 w-6" />,
        },
    ] : [];

    return (
        <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-purple-50 p-6 shadow-sm dark:from-stone-800 dark:to-stone-900">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {locale === "zh" ? "年度报告" : "Annual Report"}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setYear((y) => y - 1)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-white/50 dark:hover:bg-stone-700/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[60px] text-center font-bold text-stone-900 dark:text-stone-100">
                        {year}
                    </span>
                    <button
                        onClick={() => setYear((y) => Math.min(y + 1, new Date().getFullYear()))}
                        disabled={year >= new Date().getFullYear()}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-white/50 disabled:opacity-30 dark:hover:bg-stone-700/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative min-h-[300px]">
                {loading ? (
                    <div className="flex h-full min-h-[300px] items-center justify-center">
                        <div className="flex gap-1">
                            <span className="size-2 animate-pulse rounded-full bg-stone-400" />
                            <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
                            <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-stone-500">
                        <Calendar className="mb-2 h-10 w-10 opacity-50" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Slide Content */}
                        <div className="min-h-[280px]">
                            {slides[currentSlide]?.content}
                        </div>

                        {/* Slide Navigation */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {slides.map((slide, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${currentSlide === idx
                                            ? "bg-sage-500 text-white"
                                            : "bg-white/50 text-stone-500 hover:bg-white dark:bg-stone-700/50 dark:hover:bg-stone-700"
                                        }`}
                                >
                                    {slide.icon}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
