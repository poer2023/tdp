"use client";

import { Film, Gamepad2, Code, Server, BookOpen, Users, Wallet } from "lucide-react";
import type { ActivityFeedItem as ActivityItem } from "@/types/live-data";

interface ActivityFeedItemProps {
  item: ActivityItem;
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const icons = {
    media: Film,
    gaming: Gamepad2,
    dev: Code,
    infra: Server,
    reading: BookOpen,
    social: Users,
    finance: Wallet,
  };

  const Icon = icons[item.module];

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const content = (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <Icon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">{item.description}</p>
        <p className="mt-1 text-xs text-neutral-500">{formatTimestamp(item.timestamp)}</p>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <a href={item.href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
