"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Camera,
  Activity,
  Clock,
  Film,
  Gamepad2,
  Code,
  GitCommit,
  ArrowUpRight,
  Loader2,
  Zap,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { DashboardStatsData } from "@/lib/dashboard-stats";

// Animated Counter Component
function AnimatedCounter({
  end,
  duration = 2000,
  trigger,
}: {
  end: number;
  duration?: number;
  trigger: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      if (progress < 1) {
        setCount(Math.floor(Math.random() * end * 1.5));
      } else {
        setCount(end);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    setCount(0);
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration, trigger]);

  return <span>{count.toLocaleString()}</span>;
}

// Types
interface StatCardData {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  href?: string;
  color: string;
}

interface ZhiStatsDashboardProps {
  stats: DashboardStatsData;
  highlights?: StatCardData[];
}



export function ZhiStatsDashboard({
  stats,
  highlights,
}: ZhiStatsDashboardProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Life Log": "Life Log",
        subtitle: "Quantifying the hobbies that keep me sane.",
        "Shutter Count": "Shutter Count",
        "The Balance": "The Balance",
        "Weekly Routine": "Weekly Routine",
        Movies: "Movies",
        Games: "Games",
        "Now Playing": "Now Playing",
        Progress: "Progress",
        "The Journey": "The Journey",
        "Daily Steps": "Daily Steps",
        "Avg. Steps": "Avg. Steps",
        "The Output": "The Output",
        "Current Focus Areas": "Current Focus Areas",
        "View Details": "View Details",
      },
      zh: {
        "Life Log": "生活记录",
        subtitle: "量化那些让我保持理智的爱好。",
        "Shutter Count": "快门次数",
        "The Balance": "平衡",
        "Weekly Routine": "每周日程",
        Movies: "电影",
        Games: "游戏",
        "Now Playing": "正在玩",
        Progress: "进度",
        "The Journey": "旅程",
        "Daily Steps": "每日步数",
        "Avg. Steps": "平均步数",
        "The Output": "产出",
        "Current Focus Areas": "当前关注领域",
        "View Details": "查看详情",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const handleShutterClick = () => {
    setIsFlashing(true);
    setTimeout(() => {
      setAnimationTrigger((prev) => prev + 1);
    }, 100);
    setTimeout(() => {
      setIsFlashing(false);
    }, 300);
  };

  const avgSteps = Math.round(
    stats.stepsData.entries.reduce((acc: number, curr: { steps: number }) => acc + curr.steps, 0) / (stats.stepsData.entries.length || 1)
  );

  return (
    <div className="w-full animate-in fade-in pb-16 duration-700">
      {/* CSS Animations */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }
        .flash-overlay {
          animation: flash 0.3s ease-out;
          pointer-events: none;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 border-b border-stone-200 bg-white px-4 pb-16 pt-12 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto max-w-5xl text-center">
          <span className="mb-6 inline-block rounded-full bg-stone-100 p-3 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            <Activity size={24} strokeWidth={1.5} />
          </span>
          <h3 className="mb-4 font-serif text-4xl text-stone-900 md:text-5xl dark:text-stone-100">
            {t("Life Log")}
          </h3>
          <p className="mx-auto max-w-lg text-lg font-light text-stone-500 dark:text-stone-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Interactive Shutter Count */}
        <div className="relative col-span-1 select-none overflow-hidden rounded-2xl border border-stone-800 bg-[#171717] p-6 text-white shadow-2xl md:col-span-2">
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
              onClick={handleShutterClick}
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
                  end={stats.photoCount}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={animationTrigger}
                  data={stats.photosByWeek}
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

        {/* Card 2: Weekly Routine */}
        <div className="group col-span-1 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.routineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.routineData.map((entry, index) => (
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

        {/* Card 3: Media Diet */}
        <div className="col-span-1 flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm md:col-span-2 md:flex-row lg:col-span-2 dark:border-stone-800 dark:bg-stone-900">
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
                {stats.movieCount}
              </span>
            </div>
            <div className="h-24 min-h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.movieData}>
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
              {stats.currentGame && (
                <div className="text-right">
                  <span className="block text-xs text-stone-400">{t("Now Playing")}</span>
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {stats.currentGame.name}
                  </span>
                </div>
              )}
            </div>
            {stats.currentGame && (
              <>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-xs text-stone-500">
                    <span>{t("Progress")}</span>
                    <span>{stats.currentGame.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stats.currentGame.progress}%` }}
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

        {/* Card 4: Daily Steps */}
        <div className="group col-span-1 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
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
              {stats.stepsData.startDate && stats.stepsData.endDate && (
                <span className="block text-[10px] text-sage-600 dark:text-sage-400">
                  {stats.stepsData.startDate} - {stats.stepsData.endDate}
                </span>
              )}
            </div>
          </div>
          <div className="h-24 min-h-24 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.stepsData.entries}>
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

        {/* Card 4.5: Code Frequency (Waveform) */}
        {stats.gitHubContributions && stats.gitHubContributions.length > 0 && (
          <div className="group col-span-1 min-h-[300px] overflow-hidden rounded-2xl border border-stone-800 bg-[#0d1117] p-6 text-white shadow-2xl transition-all duration-300 hover:shadow-cyan-900/10 md:col-span-2 relative">
            {/* Background Grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-stone-800 p-2 text-white">
                    <GitCommit size={20} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-white">Code Frequency</h4>
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      LIVE ACTIVITY
                    </p>
                  </div>
                </div>

                {stats.gitHubStats && (
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-stone-400">
                        <Zap size={12} className="text-yellow-500" />
                        <span className="text-xs">Streak</span>
                      </div>
                      <span className="font-mono text-xl font-bold text-white">
                        {stats.gitHubStats.currentStreak}<span className="text-sm text-stone-500">d</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-stone-400">This Week</span>
                      <span className="font-mono text-2xl font-bold text-green-400">
                        {stats.gitHubStats.commitsWeek}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Waveform Chart */}
              <div className="mt-6 h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.gitHubContributions}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      cursor={{ stroke: '#30363d', strokeWidth: 1 }}
                      contentStyle={{
                        backgroundColor: '#161b22',
                        borderColor: '#30363d',
                        borderRadius: '6px',
                        color: '#c9d1d9',
                        fontSize: '12px'
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2ecc71"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Card 5: Skills */}
        <div className="group relative col-span-1 overflow-hidden rounded-2xl bg-stone-200 p-6 shadow-sm transition-all duration-300 hover:shadow-md md:col-span-3 dark:bg-stone-900">
          <div className="absolute right-0 top-0 p-8 opacity-5">
            <Activity size={120} />
          </div>
          <div className="relative z-10 mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
              <Code size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-serif text-lg text-stone-900 dark:text-white">
                {t("The Output")}
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {t("Current Focus Areas")}
              </p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-4">
            {stats.skillData.map((skill) => (
              <div key={skill.name}>
                <div className="mb-2 flex justify-between">
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    {skill.name}
                  </span>
                  <span className="text-xs text-stone-500">{skill.level}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-stone-300 dark:bg-stone-800">
                  <div
                    className="h-1 rounded-full bg-stone-600 transition-all duration-1000 ease-out group-hover:bg-stone-900 dark:bg-stone-400 dark:group-hover:bg-white"
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        {highlights && highlights.length > 0 && (
          <div className="col-span-1 md:col-span-3">
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
        )}
      </div>
    </div>
  );
}

export default ZhiStatsDashboard;
