"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from "react";
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
} from "recharts";
import {
  Camera,
  Activity,
  Clock,
  Film,
  Gamepad2,
  Code,
  ArrowUpRight,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { DashboardStatsData } from "@/lib/dashboard-stats";
import { NowPlayingCard, type MusicTrack } from "../now-playing-card";

// Import from extracted modules
import type { StatCardData } from "./types";
import { AnimatedCounter } from "./animated-counter";
import { CodeFrequencyHeatmap } from "./code-frequency-heatmap";

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

  // Aggregate daily contributions for Standard Heatmap (Last 3 Months / ~90 Days)
  const heatmapData = useMemo(() => {
    if (!stats.gitHubContributions) return [];

    // Create map for O(1) lookup
    const dataMap = new Map((stats.gitHubContributions || []).map(i => {
      // Ensure date string format YYYY-MM-DD
      const dateStr = typeof i.date === 'string' ? i.date.split('T')[0] : new Date(i.date).toISOString().split('T')[0];
      return [dateStr, i.value];
    }));

    const today = new Date();
    // Start from 3 months ago (~90 days)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90);

    // Align start date to the previous Sunday (to start grid correctly)
    const dayOfWeek = startDate.getDay(); // 0 = Sunday
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    // 14 weeks * 7 days = 98 grid cells (covers ~3 months with alignment)
    const totalDays = 14 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(alignedStartDate);
      d.setDate(alignedStartDate.getDate() + i);
      // Assert dateStr is string to avoid lint error
      const dateStr = d.toISOString().split('T')[0] as string;

      const isFuture = d > new Date();
      const count = isFuture ? 0 : (dataMap.get(dateStr) || 0);

      let level = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      days.push({
        date: dateStr,
        count,
        level,
        label: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [stats.gitHubContributions]);

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

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 pt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Card 1: Interactive Shutter Count - Always spans full width */}
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
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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

        {/* Card 2.5: Now Playing Music - Paired with Weekly Routine on mobile */}
        <div className="col-span-1">
          <NowPlayingCard
            track={stats.nowPlaying?.[0] as MusicTrack | null}
            recentTracks={(stats.nowPlaying?.slice(1) ?? []) as MusicTrack[]}
            locale={locale}
          />
        </div>

        {/* Card 3: Media Diet - Spans full width for complex charts */}
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
                {stats.movieCount}
              </span>
            </div>
            <div className="h-24 min-h-24">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
              {stats.stepsData.startDate && stats.stepsData.endDate && (
                <span className="block text-[10px] text-sage-600 dark:text-sage-400">
                  {stats.stepsData.startDate} - {stats.stepsData.endDate}
                </span>
              )}
            </div>
          </div>
          <div className="h-24 min-h-24 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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

        {/* Card 5: Languages (Donut) - Paired with Daily Steps on mobile */}
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
                  data={stats.skillData.map((skill) => {
                    const colors: Record<string, string> = {
                      "Python": "#3572A5",
                      "TypeScript": "#3178c6",
                      "Jupyter Notebook": "#DA5B0B",
                      "HTML": "#e34c26",
                      "CSS": "#563d7c",
                      "JavaScript": "#f1e05a"
                    };
                    return { ...skill, color: colors[skill.name] || "#a8a29e" };
                  })}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="level"
                  stroke="none"
                >
                  {stats.skillData.map((entry, index) => {
                    const colors: Record<string, string> = {
                      "Python": "#3572A5",
                      "TypeScript": "#3178c6",
                      "Jupyter Notebook": "#DA5B0B",
                      "HTML": "#e34c26",
                      "CSS": "#563d7c",
                      "JavaScript": "#f1e05a"
                    };
                    const color = colors[entry.name] || "#a8a29e";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
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
                {stats.skillData.length}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                Langs
              </span>
            </div>
          </div>
        </div>

        {/* Card 6: Code Frequency (Enhanced Heatmap) - Full width */}
        {stats.gitHubContributions && stats.gitHubContributions.length > 0 && (
          <CodeFrequencyHeatmap
            heatmapData={heatmapData}
            gitHubStats={stats.gitHubStats}
            locale={locale}
          />
        )}

        {/* Quick Links */}
        {highlights && highlights.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

export default ZhiStatsDashboard;
