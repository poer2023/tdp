/**
 * Type definitions for About Live Dashboard data
 */

export type LiveDataModule =
  | "media"
  | "gaming"
  | "infra"
  | "dev"
  | "reading"
  | "social"
  | "finance";

// ============================================================================
// Media (Jellyfin)
// ============================================================================

export interface JellyfinItem {
  id: string;
  type: "movie" | "series" | "episode";
  title: string;
  poster?: string;
  watchedAt: Date;
  progress?: number; // For series: episode progress percentage
  season?: number;
  episode?: number;
  rating?: number; // 1-5 stars
}

export interface MediaStats {
  thisWeek: { movies: number; series: number };
  thisMonth: { movies: number; series: number };
  thisYear: { totalHours: number; totalItems: number };
}

export interface MediaData {
  stats: MediaStats;
  recentlyWatched: JellyfinItem[];
  currentlyWatching: JellyfinItem[];
  watchlist?: JellyfinItem[];
}

// ============================================================================
// Gaming
// ============================================================================

export interface GamingPlatform {
  id: "steam" | "psn" | "switch";
  name: string;
  activeGames: number;
}

export interface GameSession {
  gameId: string;
  gameName: string;
  platform: GamingPlatform["id"];
  playtime: number; // hours
  lastPlayed: Date | string; // Date object in code, serialized to ISO string in JSON
  achievements?: string[];
  progress?: number; // percentage
  cover?: string;
}

export interface GamingStats {
  platforms: GamingPlatform[];
  thisMonth: { totalHours: number; gamesPlayed: number };
  thisYear: { totalHours: number; gamesPlayed: number };
}

export interface GamingData {
  stats: GamingStats;
  currentlyPlaying: GameSession[];
  recentSessions: Array<{
    date: Date | string; // Date object in code, serialized to ISO string in JSON
    gameName: string;
    duration: number;
  }>;
  playtimeHeatmap: Array<{ date: Date | string; value: number }>; // 365 days of playtime data
}

// ============================================================================
// Infrastructure
// ============================================================================

export interface ServerSpecs {
  cpu: { cores: number; usage: number };
  memory: { total: number; used: number };
  disk: { total: number; used: number };
}

export interface Server {
  id: string;
  name: string;
  location: "CN" | "US" | "JP" | "EU";
  status: "healthy" | "warning" | "down";
  specs: ServerSpecs;
  services: string[];
  uptime: number; // days
}

export interface SelfHostedService {
  id: string;
  name: string;
  displayName: string;
  status: "running" | "stopped" | "maintenance";
  url?: string;
  server: string; // server id
  uptime: number; // days
  metadata?: Record<string, string | number>;
}

export interface InfraEvent {
  timestamp: Date;
  type: "info" | "warning" | "error";
  message: string;
  serverId?: string;
  serviceId?: string;
}

export interface NetworkTraffic {
  timestamp: Date;
  inbound: number; // GB
  outbound: number; // GB
}

export interface InfraData {
  servers: Server[];
  services: SelfHostedService[];
  events: InfraEvent[];
  networkTraffic: NetworkTraffic[];
}

// ============================================================================
// Development Activity
// ============================================================================

export interface GitHubRepo {
  name: string;
  fullName: string;
  language: string;
  commitsThisMonth: number;
  lastCommit: {
    date: Date | string; // Date object in code, serialized to ISO string in JSON
    message: string;
  };
}

export interface DevStats {
  thisWeek: { commits: number; repos: number };
  thisMonth: { commits: number; pullRequests: number };
  thisYear: { stars: number; repos: number };
  currentStreak: number; // days
}

export interface WakaTimeLanguage {
  name: string;
  percentage: number;
  hours: number;
}

export interface DevData {
  stats: DevStats;
  contributionHeatmap: Array<{ date: Date | string; value: number }>; // 365 days of contribution data
  activeRepos: GitHubRepo[];
  languages?: WakaTimeLanguage[];
}

// ============================================================================
// Reading
// ============================================================================

export interface Book {
  title: string;
  author: string;
  cover?: string;
  progress?: number; // percentage
  currentPage?: number;
  totalPages?: number;
  startedAt?: Date;
  finishedAt?: Date;
  rating?: number; // 1-5 stars
}

export interface Article {
  title: string;
  source: string;
  url: string;
  readAt: Date | string; // Date object in code, serialized to ISO string in JSON
}

export interface ReadingStats {
  thisMonth: { books: number; articles: number };
  thisYear: { books: number; articles: number };
  allTime: { books: number; articles: number };
}

export interface ReadingData {
  stats: ReadingStats;
  currentlyReading: Book[];
  recentlyFinished: Book[];
  recentArticles: Article[];
}

// ============================================================================
// Social (Privacy-sensitive)
// ============================================================================

export interface SocialStats {
  thisWeek: { conversations: number; calls: number };
  thisMonth: { conversations: number; calls: number };
  activePeople: number;
  activeGroups: number;
}

export interface SocialInteraction {
  timestamp: Date | string; // Date object in code, serialized to ISO string in JSON
  type: "chat" | "call" | "group";
  platform: string;
  anonymizedId: string; // Anonymized for privacy
  duration?: number; // For calls, in minutes
}

export interface SocialData {
  stats: SocialStats;
  recentInteractions: SocialInteraction[];
  platformStats: Record<string, number>; // platform -> interaction count
}

// ============================================================================
// Finance (Privacy-sensitive)
// ============================================================================

export interface ExpenseCategory {
  name: string;
  percentage: number;
  amount?: number; // Optional, can be hidden
}

export interface Subscription {
  name: string;
  category: string;
  amount?: string; // Can be anonymized like "$$$"
  renewalDate?: Date | string; // Date object in code, serialized to ISO string in JSON
}

export interface FinanceData {
  monthlyTrend: number[]; // Last 12 months, normalized or actual
  categories: ExpenseCategory[];
  subscriptions: Subscription[];
  insights: string[];
}

// ============================================================================
// Highlights (for main about page)
// ============================================================================

export interface LiveHighlight {
  module: LiveDataModule;
  icon: string;
  title: string;
  subtitle: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  href: string;
}

export interface LiveHighlightsData {
  highlights: LiveHighlight[];
  lastUpdated: Date;
}

// ============================================================================
// Activity Feed
// ============================================================================

export interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  module: LiveDataModule;
  type: string; // e.g., "movie_watched", "game_played", "commit_pushed"
  description: string;
  metadata?: Record<string, unknown>;
  href?: string; // Link to detail page with anchor
}

export interface ActivityFeedData {
  items: ActivityFeedItem[];
  hasMore: boolean;
  nextCursor?: string;
}
