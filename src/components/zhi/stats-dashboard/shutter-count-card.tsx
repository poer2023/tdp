"use client";

import React from "react";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Camera } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";

export type ShutterCountCardProps = {
    photoCount: number;
    photosByWeek: { day: string; count: number }[];
    animationTrigger: number;
    isFlashing: boolean;
    onShutterClick: () => void;
    t: (key: string) => string;
};

export function ShutterCountCard({
    photoCount,
    photosByWeek,
    animationTrigger,
    isFlashing,
    onShutterClick,
    t,
}: ShutterCountCardProps) {
    return (
        <div className="relative col-span-1 sm:col-span-2 select-none overflow-hidden rounded-2xl border border-stone-800 bg-[#171717] p-4 text-white shadow-2xl sm:p-6 lg:col-span-2">
            {/* Flash Overlay */}
            {isFlashing && (
                <div className="flash-overlay absolute inset-0 z-50 bg-white"></div>
            )}

            {/* Background Texture */}
            <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "radial-gradient(#333 1px, transparent 0)",
                    backgroundSize: "10px 10px",
                }}
            ></div>

            {/* HUD Overlay */}
            <div className="absolute left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-cyan-500/50"></div>
            <div className="absolute right-4 top-4 h-4 w-4 border-r-2 border-t-2 border-cyan-500/50"></div>
            <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-cyan-500/50"></div>
            <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-cyan-500/50"></div>

            {/* AF Focus Box Center */}
            <div
                className={`absolute left-1/2 top-1/2 h-12 w-16 -translate-x-1/2 -translate-y-1/2 border transition-all duration-100 ${isFlashing ? "h-10 w-14 scale-90 border-green-500" : "scale-100 border-yellow-500/50"}`}
            >
                <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/50"></div>
            </div>

            {/* Header Row */}
            <div className="relative z-20 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className={`flex items-center gap-2 font-mono text-xs font-bold transition-colors ${isFlashing ? "text-red-500" : "text-stone-500"}`}
                    >
                        <div
                            className={`h-2 w-2 rounded-full ${isFlashing ? "bg-red-500" : "bg-stone-500"}`}
                        ></div>
                        REC
                    </div>
                    <div className="rounded border border-stone-700 bg-stone-900 px-2 py-0.5 font-mono text-[10px] text-stone-400">
                        1/8000s
                    </div>
                </div>

                {/* Shutter Button */}
                <button
                    onClick={onShutterClick}
                    className="group/btn relative flex items-center justify-center"
                    title="Capture Frame"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-800 shadow-lg transition-transform active:scale-95">
                        <div className="h-8 w-8 rounded-full border border-stone-800 bg-stone-900"></div>
                    </div>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex min-h-64 w-full flex-col gap-6 md:flex-row">
                {/* Left: Stats */}
                <div className="flex w-full flex-col justify-end border-r border-stone-800/50 pb-4 pr-4 md:w-1/3">
                    <div className="mb-1 flex items-center gap-2 text-cyan-500/80">
                        <Camera size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {t("Shutter Count")}
                        </span>
                    </div>
                    <div className="font-mono text-6xl font-bold leading-none tracking-tighter text-white tabular-nums">
                        <AnimatedCounter
                            end={photoCount}
                            trigger={animationTrigger}
                            duration={1000}
                        />
                    </div>
                    <div className="mt-4 space-y-1 font-mono text-[10px] text-stone-500">
                        <div className="flex justify-between">
                            <span>BUFFER</span>
                            <span className="text-cyan-500">{isFlashing ? "BUSY" : "READY"}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="relative flex-1">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart
                            key={animationTrigger}
                            data={photosByWeek}
                            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                                contentStyle={{
                                    background: "rgba(23, 23, 23, 0.9)",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                }}
                            />
                            <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
