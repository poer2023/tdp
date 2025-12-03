"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { t, type AdminLocale } from "@/lib/admin-translations";

type ContentDistributionData = {
  totalPosts: number;
  totalMoments: number;
  totalGallery: number;
  totalProjects: number;
};

type ContentDistributionChartProps = {
  data: ContentDistributionData;
  locale: AdminLocale;
};

// Colors matching Lumina and stats cards
const CHART_COLORS = {
  posts: "#f97316",    // orange-500
  moments: "#3b82f6",  // blue-500
  gallery: "#a855f7",  // purple-500
  projects: "#10b981", // emerald-500
};

export function ContentDistributionChart({ data, locale }: ContentDistributionChartProps) {
  const chartData = [
    { name: t(locale, "postsLabel"), count: data.totalPosts, color: CHART_COLORS.posts },
    { name: t(locale, "moments"), count: data.totalMoments, color: CHART_COLORS.moments },
    { name: t(locale, "gallery"), count: data.totalGallery, color: CHART_COLORS.gallery },
    { name: t(locale, "projects"), count: data.totalProjects, color: CHART_COLORS.projects },
  ];

  return (
    <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
          <BarChart3 size={18} />
          {t(locale, "contentDistribution")}
        </h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1c1917',
                color: '#fff'
              }}
            />
            <Bar dataKey="count" fill="#44403c" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
