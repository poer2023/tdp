"use client";

import React, { useState, useMemo } from "react";
import { GitCommit, ArrowUpRight, Zap } from "lucide-react";
import type { HeatmapDay, CodeFrequencyHeatmapProps } from "./types";

/**
 * Code Frequency Heatmap Component with Modern Design
 * Displays GitHub-style contribution heatmap
 */
export function CodeFrequencyHeatmap({ heatmapData, gitHubStats, locale }: CodeFrequencyHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

    // Get color class based on level - purple-cyan gradient
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-stone-100 dark:bg-stone-800/50';
            case 1: return 'bg-violet-200 dark:bg-violet-900/50';
            case 2: return 'bg-violet-400 dark:bg-violet-700/70';
            case 3: return 'bg-fuchsia-500 dark:bg-fuchsia-600/80';
            case 4: return 'bg-cyan-400 dark:bg-cyan-500';
            default: return 'bg-stone-100 dark:bg-stone-800/50';
        }
    };

    // Group data by weeks (7 days per week, starting from Sunday)
    const weeks = useMemo(() => {
        const result: HeatmapDay[][] = [];
        for (let i = 0; i < heatmapData.length; i += 7) {
            result.push(heatmapData.slice(i, i + 7));
        }
        return result;
    }, [heatmapData]);

    // Get month labels with positions
    const monthLabels = useMemo(() => {
        const labels: { label: string; weekIndex: number }[] = [];
        let lastMonth = -1;

        weeks.forEach((week, weekIndex) => {
            // Check the first day of each week
            const firstDay = week[0];
            if (firstDay) {
                const date = new Date(firstDay.date);
                const month = date.getMonth();
                if (month !== lastMonth) {
                    const monthName = date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' });
                    labels.push({ label: monthName, weekIndex });
                    lastMonth = month;
                }
            }
        });

        return labels;
    }, [weeks, locale]);

    // Calculate total contributions
    const totalContributions = useMemo(() => {
        return heatmapData.reduce((sum, day) => sum + day.count, 0);
    }, [heatmapData]);

    const weekDays = locale === 'zh' ? ['', '一', '', '三', '', '五', ''] : ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    const handleMouseEnter = (day: HeatmapDay, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHoveredDay({
            day,
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });
    };

    return (
        <div className="group col-span-1 min-h-[280px] overflow-hidden rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md relative sm:p-5 dark:border-stone-800 dark:bg-stone-900">
            {/* Subtle gradient background */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
                style={{
                    background: 'radial-gradient(ellipse at top right, #c084fc, transparent 50%), radial-gradient(ellipse at bottom left, #22d3ee, transparent 50%)'
                }}
            />

            <div className="relative z-10 flex h-full flex-col">
                {/* Header - Fixed layout to prevent wrapping */}
                <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-xl bg-gradient-to-br from-violet-100 to-cyan-100 p-2 text-violet-600 flex-shrink-0 dark:from-violet-900/30 dark:to-cyan-900/30 dark:text-violet-400">
                            <GitCommit size={18} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-serif text-base text-stone-800 whitespace-nowrap dark:text-stone-100">
                                {locale === 'zh' ? '代码频率' : 'Code Frequency'}
                            </h4>
                            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                </span>
                                {totalContributions.toLocaleString()} {locale === 'zh' ? '次提交' : 'commits'}
                            </p>
                        </div>
                    </div>

                    {gitHubStats && (
                        <div className="flex gap-3 flex-shrink-0">
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-0.5 text-stone-400">
                                    <Zap size={10} className="text-amber-500" />
                                    <span className="text-[9px] whitespace-nowrap">{locale === 'zh' ? '连续' : 'Streak'}</span>
                                </div>
                                <span className="font-mono text-lg font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                                    {gitHubStats.currentStreak}<span className="text-xs text-stone-400">d</span>
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] text-stone-400 whitespace-nowrap">{locale === 'zh' ? '本周' : 'Week'}</span>
                                <span className="font-mono text-xl font-bold text-cyan-500">
                                    {gitHubStats.commitsWeek}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Heatmap Container */}
                <div className="flex-1 flex flex-col">
                    {/* Month Labels - Positioned above the grid with correct alignment */}
                    <div className="flex mb-1">
                        <div className="w-6 flex-shrink-0" /> {/* Spacer for week day labels */}
                        <div className="relative flex-1" style={{ height: '14px' }}>
                            {monthLabels.map(({ label, weekIndex }, idx) => (
                                <span
                                    key={idx}
                                    className="absolute text-[9px] font-medium text-stone-400 dark:text-stone-500"
                                    style={{ left: `${weekIndex * 15}px` }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap Grid with Week Labels */}
                    <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                        {/* Week day labels */}
                        <div className="flex flex-col gap-[3px] pr-1 flex-shrink-0">
                            {weekDays.map((day, idx) => (
                                <div key={idx} className="h-[12px] flex items-center justify-end">
                                    <span className="text-[8px] font-medium text-stone-400 dark:text-stone-500 w-5 text-right">
                                        {day}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid - Circular dots style */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={dayIdx}
                                            className={`h-[12px] w-[12px] rounded-full transition-all cursor-pointer
                        hover:ring-2 hover:ring-violet-400/50 hover:scale-125
                        ${getLevelColor(day.level)}`}
                                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        />
                                    ))}
                                    {/* Fill empty days at end of last week */}
                                    {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, idx) => (
                                        <div key={`empty-${idx}`} className="h-[12px] w-[12px]" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-stone-400">{locale === 'zh' ? '少' : 'Less'}</span>
                            <div className="flex gap-[2px]">
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <div key={level} className={`h-[8px] w-[8px] rounded-full ${getLevelColor(level)}`} />
                                ))}
                            </div>
                            <span className="text-[9px] text-stone-400">{locale === 'zh' ? '多' : 'More'}</span>
                        </div>
                        <a
                            href="https://github.com/ZhiHao-He"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[9px] text-stone-400 hover:text-violet-500 transition-colors"
                        >
                            <span>@GitHub</span>
                            <ArrowUpRight size={9} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Floating Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-2 rounded-lg shadow-xl text-center">
                        <div className="font-bold text-sm">
                            {hoveredDay.day.count} {locale === 'zh' ? '次提交' : hoveredDay.day.count === 1 ? 'contribution' : 'contributions'}
                        </div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {new Date(hoveredDay.day.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        {/* Tooltip Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-stone-900 dark:border-t-stone-100" />
                    </div>
                </div>
            )}
        </div>
    );
}
