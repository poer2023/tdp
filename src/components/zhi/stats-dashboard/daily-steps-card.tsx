"use client";

import React from "react";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

export type DailyStepsCardProps = {
    stepsData: {
        entries: { dayNum: number; steps: number }[];
        startDate?: string;
        endDate?: string;
    };
    avgSteps: number;
    t: (key: string) => string;
};

export function DailyStepsCard({ stepsData, avgSteps, t }: DailyStepsCardProps) {
    return (
        <div className="group col-span-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-sage-50 p-2 text-sage-600 transition-colors group-hover:bg-sage-100 dark:bg-sage-900/10 dark:text-sage-400 dark:group-hover:bg-sage-900/20">
                        <Activity size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h4 className="font-serif text-lg text-stone-800 dark:text-stone-100">
                            {t("The Journey")}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            {t("Daily Steps")}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xl font-bold text-stone-800 dark:text-stone-100">
                        {avgSteps.toLocaleString()}
                    </span>
                    {stepsData.startDate && stepsData.endDate && (
                        <span className="block text-[10px] text-sage-600 dark:text-sage-400">
                            {stepsData.startDate} - {stepsData.endDate}
                        </span>
                    )}
                </div>
            </div>
            <div className="h-24 min-h-24 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={stepsData.entries}>
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                backgroundColor: "#fff",
                                color: "#333",
                                padding: "8px 12px",
                            }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length > 0) {
                                    const data = payload[0]?.payload as { dayNum: number; steps: number } | undefined;
                                    if (!data) return null;
                                    return (
                                        <div className="rounded-lg bg-white px-3 py-2 shadow-lg dark:bg-stone-800">
                                            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                                                {data.dayNum}
                                            </p>
                                            <p className="text-lg font-bold text-sage-600">
                                                {data.steps.toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="steps" fill="#5c9c6d" radius={[4, 4, 4, 4]} barSize={8} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
