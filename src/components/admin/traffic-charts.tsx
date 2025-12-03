"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LuminaChartCard } from "./lumina-shared";

type TrafficKpi = {
  label: string;
  value: string | number;
  deltaLabel?: string;
  positive?: boolean;
  icon: React.ReactNode;
  iconColor: string;
};

type TrafficChartsProps = {
  kpis?: TrafficKpi[];
  trendTitle?: string;
  trendData?: Array<{ date: string; views: number }>;
  topPages?: Array<{ path: string; views: number }>;
  sourceBreakdown?: Array<{ label: string; value: number }>;
  deviceBreakdown?: Array<{ label: string; value: number; percentage: number }>;
};

// Icons for KPI cards
function EyeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
}

const demoKpis: TrafficKpi[] = [
  {
    label: "总访次",
    value: "12,480",
    deltaLabel: "+8% 对比上周",
    positive: true,
    icon: <EyeIcon />,
    iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
  },
  {
    label: "独立访客",
    value: "9,240",
    deltaLabel: "+5%",
    positive: true,
    icon: <UsersIcon />,
    iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
  },
  {
    label: "平均停留",
    value: "03:42",
    deltaLabel: "-3%",
    positive: false,
    icon: <ClockIcon />,
    iconColor: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
  },
  {
    label: "跳出率",
    value: "41%",
    deltaLabel: "-1.2%",
    positive: true,
    icon: <ActivityIcon />,
    iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
  },
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
  { label: "Desktop", value: 1840, percentage: 52 },
  { label: "Mobile", value: 1420, percentage: 40 },
  { label: "Tablet", value: 280, percentage: 8 },
];
const demoTopPages = [
  { path: "/posts/design-system", views: 1240 },
  { path: "/posts/next-cache", views: 980 },
  { path: "/gallery", views: 760 },
  { path: "/m/travel-notes", views: 640 },
  { path: "/projects", views: 520 },
];

const palette = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

export function TrafficCharts({
  kpis = demoKpis,
  trendTitle = "流量趋势",
  trendData = demoTrend,
  topPages = demoTopPages,
  sourceBreakdown = demoSources,
  deviceBreakdown = demoDevices,
}: TrafficChartsProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards with Icons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {kpi.label}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {kpi.value}
                </h3>
                {kpi.deltaLabel && (
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${
                        kpi.positive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {kpi.deltaLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${kpi.iconColor}`}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Overview and Acquisition Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LuminaChartCard title={trendTitle} description="近期访问走势">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 13
                    }}
                    formatter={(value: number) => [value, "访问量"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trafficGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LuminaChartCard>
        </div>

        <LuminaChartCard title="来源分布" description="各渠道流量占比">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {sourceBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 13
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LuminaChartCard>
      </div>

      {/* Top Pages and Device Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LuminaChartCard title="热门页面" description="访问量最高的 5 个页面">
          <div className="space-y-3">
            {topPages.map((page, idx) => (
              <div
                key={page.path}
                className="flex items-center gap-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 px-4 py-3 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {page.path}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <EyeIcon />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {page.views.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </LuminaChartCard>

        <LuminaChartCard title="设备分布" description="不同设备类型的访问量">
          <div className="space-y-4 pt-2">
            {deviceBreakdown.map((device) => (
              <div key={device.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {device.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 dark:text-stone-400">
                      {device.value.toLocaleString()}
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {device.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </LuminaChartCard>
      </div>
    </div>
  );
}
