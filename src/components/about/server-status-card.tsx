"use client";

import { Server, Cpu, HardDrive, MemoryStick } from "lucide-react";
import type { Server as ServerType } from "@/types/live-data";

interface ServerStatusCardProps {
  server: ServerType;
  onClick?: () => void;
}

export function ServerStatusCard({ server, onClick }: ServerStatusCardProps) {
  const statusColors = {
    healthy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    down: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusDots = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    down: "bg-red-500",
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-600 dark:text-red-400";
    if (usage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div
      className={`rounded-xl border border-stone-200 bg-white p-6 transition-all dark:border-stone-800 dark:bg-stone-900 ${
        onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
            <Server className="h-5 w-5 text-stone-600 dark:text-stone-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{server.name}</h3>
            <p className="text-sm text-stone-500">{server.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusDots[server.status]} animate-pulse`} />
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[server.status]}`}
          >
            {server.status}
          </span>
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-stone-400" />
            <span className="text-stone-600 dark:text-stone-400">CPU</span>
          </div>
          <span className={`font-medium ${getUsageColor(server.specs.cpu.usage)}`}>
            {server.specs.cpu.usage}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-stone-400" />
            <span className="text-stone-600 dark:text-stone-400">Memory</span>
          </div>
          <span
            className={`font-medium ${getUsageColor((server.specs.memory.used / server.specs.memory.total) * 100)}`}
          >
            {server.specs.memory.used.toFixed(1)} / {server.specs.memory.total} GB
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-stone-400" />
            <span className="text-stone-600 dark:text-stone-400">Disk</span>
          </div>
          <span
            className={`font-medium ${getUsageColor((server.specs.disk.used / server.specs.disk.total) * 100)}`}
          >
            {server.specs.disk.used} / {server.specs.disk.total} GB
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
        <p className="mb-2 text-xs text-stone-500">Services ({server.services.length})</p>
        <div className="flex flex-wrap gap-1">
          {server.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              {service}
            </span>
          ))}
          {server.services.length > 3 && (
            <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              +{server.services.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Uptime */}
      <div className="mt-3 text-xs text-stone-500">Uptime: {server.uptime} days</div>
    </div>
  );
}
