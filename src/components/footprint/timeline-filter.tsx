"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface YearStats {
    year: number;
    trips: number;
    distance: number;
    duration: number;
}

interface MonthStats {
    month: number;
    trips: number;
    distance: number;
    duration: number;
}

interface TimelineFilterProps {
    onFilterChange: (year: number | null, month: number | null) => void;
    locale: "zh" | "en";
}

const monthNames = {
    zh: ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    en: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function TimelineFilter({ onFilterChange, locale }: TimelineFilterProps) {
    const [years, setYears] = useState<YearStats[]>([]);
    const [months, setMonths] = useState<MonthStats[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Load years on mount
    useEffect(() => {
        const loadYears = async () => {
            try {
                const res = await fetch("/api/footprint/timeline");
                const data = await res.json();
                setYears(data.years || []);
                // Auto-select current year if available
                const currentYear = new Date().getFullYear();
                if (data.years?.some((y: YearStats) => y.year === currentYear)) {
                    setSelectedYear(currentYear);
                } else if (data.years?.length > 0) {
                    setSelectedYear(data.years[0].year);
                }
            } catch (err) {
                console.error("Failed to load years:", err);
            } finally {
                setLoading(false);
            }
        };
        loadYears();
    }, []);

    // Load months when year changes
    useEffect(() => {
        if (!selectedYear) {
            setMonths([]);
            return;
        }

        const loadMonths = async () => {
            try {
                const res = await fetch(`/api/footprint/timeline?year=${selectedYear}`);
                const data = await res.json();
                setMonths(data.months || []);
            } catch (err) {
                console.error("Failed to load months:", err);
            }
        };
        loadMonths();
    }, [selectedYear]);

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange(selectedYear, selectedMonth);
    }, [selectedYear, selectedMonth, onFilterChange]);

    const maxMonthTrips = Math.max(...months.map((m) => m.trips), 1);

    if (loading) {
        return (
            <div className="flex h-20 items-center justify-center">
                <div className="flex gap-1">
                    <span className="size-2 animate-pulse rounded-full bg-stone-400" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
                </div>
            </div>
        );
    }

    if (years.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-stone-800">
            {/* Year Selector */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                    <Calendar className="h-4 w-4" />
                    {locale === "zh" ? "时间筛选" : "Timeline"}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            const idx = years.findIndex((y) => y.year === selectedYear);
                            if (idx >= 0 && idx < years.length - 1 && years[idx + 1]) {
                                setSelectedYear(years[idx + 1]!.year);
                                setSelectedMonth(null);
                            }
                        }}
                        disabled={years.findIndex((y) => y.year === selectedYear) >= years.length - 1}
                        className="rounded-md p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-700"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[60px] text-center text-lg font-bold text-stone-900 dark:text-stone-100">
                        {selectedYear || "-"}
                    </span>
                    <button
                        onClick={() => {
                            const idx = years.findIndex((y) => y.year === selectedYear);
                            if (idx > 0 && years[idx - 1]) {
                                setSelectedYear(years[idx - 1]!.year);
                                setSelectedMonth(null);
                            }
                        }}
                        disabled={years.findIndex((y) => y.year === selectedYear) <= 0}
                        className="rounded-md p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-700"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Month Bar Chart */}
            <div className="flex items-end gap-1">
                {months.map((m) => (
                    <button
                        key={m.month}
                        onClick={() => setSelectedMonth(selectedMonth === m.month ? null : m.month)}
                        className={`group flex-1 flex flex-col items-center transition-all ${selectedMonth === m.month ? "scale-105" : ""
                            }`}
                    >
                        <div
                            className={`w-full rounded-t transition-all ${selectedMonth === m.month
                                ? "bg-sage-500"
                                : m.trips > 0
                                    ? "bg-sage-200 group-hover:bg-sage-300 dark:bg-sage-800 dark:group-hover:bg-sage-700"
                                    : "bg-stone-100 dark:bg-stone-700"
                                }`}
                            style={{
                                height: `${Math.max(4, (m.trips / maxMonthTrips) * 40)}px`,
                            }}
                        />
                        <span
                            className={`mt-1 text-[10px] ${selectedMonth === m.month
                                ? "font-bold text-sage-600 dark:text-sage-400"
                                : "text-stone-400"
                                }`}
                        >
                            {monthNames[locale]?.[m.month] || m.month}
                        </span>
                    </button>
                ))}
            </div>

            {/* Selected Stats */}
            {selectedMonth && (
                <div className="mt-3 flex justify-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                    <span>
                        {months[selectedMonth - 1]?.trips || 0} {locale === "zh" ? "次出行" : "trips"}
                    </span>
                    <span>
                        {(months[selectedMonth - 1]?.distance || 0).toFixed(1)} km
                    </span>
                </div>
            )}

            {/* Clear Filter */}
            {(selectedYear || selectedMonth) && (
                <button
                    onClick={() => {
                        setSelectedYear(null);
                        setSelectedMonth(null);
                    }}
                    className="mt-3 w-full rounded-lg bg-stone-100 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-400 dark:hover:bg-stone-600"
                >
                    {locale === "zh" ? "清除筛选" : "Clear Filter"}
                </button>
            )}
        </div>
    );
}
