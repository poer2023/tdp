"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Code } from "lucide-react";

export type LanguagesCardProps = {
    skillData: { name: string; level: number }[];
    t: (key: string) => string;
};

const LANGUAGE_COLORS: Record<string, string> = {
    "Python": "#3572A5",
    "TypeScript": "#3178c6",
    "Jupyter Notebook": "#DA5B0B",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "JavaScript": "#f1e05a",
};

export function LanguagesCard({ skillData, t }: LanguagesCardProps) {
    const dataWithColors = skillData.map((skill) => ({
        ...skill,
        color: LANGUAGE_COLORS[skill.name] || "#a8a29e",
    }));

    return (
        <div className="group col-span-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2 text-orange-500 transition-colors group-hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:group-hover:bg-orange-900/20">
                    <Code size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h4 className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        {t("The Output")}
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Languages
                    </p>
                </div>
            </div>
            <div className="relative h-40 min-h-40 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                        <Pie
                            data={dataWithColors}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="level"
                            stroke="none"
                        >
                            {dataWithColors.map((entry, index) => (
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
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-stone-800 dark:text-stone-100">
                        {skillData.length}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                        Langs
                    </span>
                </div>
            </div>
        </div>
    );
}
