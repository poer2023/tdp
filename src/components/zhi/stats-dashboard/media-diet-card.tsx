"use client";

import React from "react";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";
import { Film, Gamepad2 } from "lucide-react";

export type MediaDietCardProps = {
    movieCount: number;
    movieData: { month: string; movies: number }[];
    currentGame: { name: string; progress: number } | null;
    t: (key: string) => string;
};

export function MediaDietCard({ movieCount, movieData, currentGame, t }: MediaDietCardProps) {
    return (
        <div className="col-span-1 sm:col-span-2 flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm md:flex-row lg:col-span-2 dark:border-stone-800 dark:bg-stone-900">
            {/* Movies Section */}
            <div className="group flex-1 border-b border-stone-100 p-6 transition-colors hover:bg-stone-50 md:border-b-0 md:border-r dark:border-stone-800 dark:hover:bg-stone-800/30">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-rose-50 p-2 text-rose-500 dark:bg-rose-900/10">
                            <Film size={18} />
                        </div>
                        <h4 className="font-serif text-md text-stone-800 dark:text-stone-100">
                            {t("Movies")}
                        </h4>
                    </div>
                    <span className="text-2xl font-bold text-stone-800 dark:text-stone-200">
                        {movieCount}
                    </span>
                </div>
                <div className="h-24 min-h-24">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={movieData}>
                            <Bar dataKey="movies" fill="#fb7185" radius={[2, 2, 0, 0]} />
                            <XAxis
                                dataKey="month"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#a8a29e" }}
                            />
                            <Tooltip
                                cursor={{ fill: "transparent" }}
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Games Section */}
            <div className="group flex-1 p-6 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/30">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-900/10">
                            <Gamepad2 size={18} />
                        </div>
                        <h4 className="font-serif text-md text-stone-800 dark:text-stone-100">
                            {t("Games")}
                        </h4>
                    </div>
                    {currentGame && (
                        <div className="text-right">
                            <span className="block text-xs text-stone-400">{t("Now Playing")}</span>
                            <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                                {currentGame.name}
                            </span>
                        </div>
                    )}
                </div>
                {currentGame && (
                    <>
                        <div className="mt-2">
                            <div className="mb-1 flex justify-between text-xs text-stone-500">
                                <span>{t("Progress")}</span>
                                <span>{currentGame.progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${currentGame.progress}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            {["RPG", "Strategy"].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded border border-stone-200 bg-stone-100 px-2 py-1 text-[10px] text-stone-500 dark:border-stone-700 dark:bg-stone-800"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
