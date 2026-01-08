"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StatCardData } from "./types";

export type QuickLinksCardProps = {
    highlights: StatCardData[];
    t: (key: string) => string;
};

export function QuickLinksCard({ highlights, t }: QuickLinksCardProps) {
    if (!highlights || highlights.length === 0) return null;

    return (
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <h3 className="mb-4 font-serif text-xl text-stone-800 dark:text-stone-100">
                {t("View Details")}
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {highlights.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href || "#"}
                        className="group flex items-center gap-3 rounded-xl border border-stone-100 bg-white p-4 transition-all hover:border-sage-200 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-sage-700"
                    >
                        <div className={`rounded-lg p-2 ${item.color}`}>{item.icon}</div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-stone-800 dark:text-stone-100">
                                {item.title}
                            </div>
                            <div className="text-xs text-stone-500">{item.value}</div>
                        </div>
                        <ArrowUpRight
                            size={16}
                            className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}
