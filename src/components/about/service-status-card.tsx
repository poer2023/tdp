"use client";

import { ExternalLink, Circle } from "lucide-react";
import type { SelfHostedService } from "@/types/live-data";

interface ServiceStatusCardProps {
  service: SelfHostedService;
}

export function ServiceStatusCard({ service }: ServiceStatusCardProps) {
  const statusConfig = {
    running: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Running",
    },
    stopped: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: "Stopped",
    },
    maintenance: {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Maintenance",
    },
  };

  const config = statusConfig[service.status];

  return (
    <div className="group rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Circle
            className={`mt-1 h-2 w-2 fill-current ${config.color} ${service.status === "running" ? "animate-pulse" : ""}`}
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                {service.displayName}
              </h4>
              {service.url && (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
                </a>
              )}
            </div>
            <p className="text-sm text-neutral-500">
              {service.server} • Uptime: {service.uptime}d
            </p>
            {service.metadata && Object.keys(service.metadata).length > 0 && (
              <div className="mt-2 flex gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                {Object.entries(service.metadata).map(([key, value]) => (
                  <span key={key}>
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
