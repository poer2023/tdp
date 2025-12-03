"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LuminaChartCard, LuminaStatCard } from "./lumina-shared";

type TrafficKpi = {
  label: string;
  value: string | number;
  deltaLabel?: string;
  positive?: boolean;
};

type TrafficChartsProps = {
  kpis?: TrafficKpi[];
  trendTitle?: string;
  trendData?: Array<{ date: string; views: number }>;
  topPages?: Array<{ path: string; views: number }>;
  sourceBreakdown?: Array<{ label: string; value: number }>;
  deviceBreakdown?: Array<{ label: string; value: number }>;
};

const demoKpis: TrafficKpi[] = [
  { label: "访次", value: "12,480", deltaLabel: "+8% 对比上周", positive: true },
  { label: "独立访客", value: "9,240", deltaLabel: "+5%", positive: true },
  { label: "平均停留", value: "03:42", deltaLabel: "-3%", positive: false },
  { label: "跳出率", value: "41%", deltaLabel: "-1.2%", positive: true },
];

const demoTrend = [
  { date: "Mon", views: 120 },
  { date: "Tue", views: 150 },
  { date: "Wed", views: 180 },
  { date: "Thu", views: 140 },
  { date: "Fri", views: 210 },
  { date: "Sat", views: 260 },
  { date: "Sun", views: 240 },
];

const demoSources = [
  { label: "Direct", value: 42 },
  { label: "Search", value: 33 },
  { label: "Social", value: 18 },
  { label: "Referrals", value: 7 },
];
const demoDevices = [
  { label: "Mobile", value: 62 },
  { label: "Desktop", value: 34 },
  { label: "Tablet", value: 4 },
];
const demoTopPages = [
  { path: "/posts/design-system", views: 1240 },
  { path: "/posts/next-cache", views: 980 },
  { path: "/gallery", views: 760 },
  { path: "/m/travel-notes", views: 640 },
  { path: "/projects", views: 520 },
];

const palette = ["#7c9a92", "#94a3b8", "#fbbf24", "#22c55e", "#c084fc", "#38bdf8"];

export function TrafficCharts({
  kpis = demoKpis,
  trendTitle = "流量趋势",
  trendData = demoTrend,
  topPages = demoTopPages,
  sourceBreakdown = demoSources,
  deviceBreakdown = demoDevices,
}: TrafficChartsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <LuminaStatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LuminaChartCard title={trendTitle} description="近期访问走势">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6bb28f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6bb28f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb" }}
                    formatter={(value: number) => [value, "Views"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#6bb28f"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#trafficGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LuminaChartCard>
        </div>

        <LuminaChartCard title="来源分布" description="按来源的占比">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {sourceBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LuminaChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LuminaChartCard title="热门页面" description="Top 5 路径">
          <div className="space-y-2 text-sm text-stone-700 dark:text-stone-200">
            {topPages.map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-800"
              >
                <span className="truncate">{page.path}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">{page.views} views</span>
              </div>
            ))}
          </div>
        </LuminaChartCard>

        <LuminaChartCard title="设备分布" description="设备占比">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#7c9a92" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LuminaChartCard>
      </div>
    </div>
  );
}
