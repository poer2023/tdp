"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Clock } from "lucide-react";

export type WeeklyRoutineCardProps = {
    routineData: { name: string; value: number; color: string }[];
    t: (key: string) => string;
};

export function WeeklyRoutineCard({ routineData, t }: WeeklyRoutineCardProps) {
    return (
        <div className="group col-span-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-900/10 dark:group-hover:bg-indigo-900/20">
                    <Clock size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h4 className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        {t("The Balance")}
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {t("Weekly Routine")}
                    </p>
                </div>
            </div>
            <div className="relative h-40 min-h-40 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                        <Pie
                            data={routineData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {routineData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="font-serif text-sm italic text-stone-400">24h</span>
                </div>
            </div>
        </div>
    );
}
