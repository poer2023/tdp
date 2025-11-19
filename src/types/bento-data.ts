/**
 * Type definitions for Bento grid cards data
 */

export interface CurrentMoodData {
  emoji: string;
  status: string;
  quote: string;
}

export interface GitHubData {
  totalCommits: string;
  contributions: number[]; // Array of 40 values (0-4 intensity levels)
}

export interface MediaItem {
  type: 'book' | 'movie' | 'anime' | 'music';
  title: string;
  author: string;
  rating: number; // 1-5
  cover: string;
}

export interface SteamData {
  playing: string;
  hours: string;
  bg: string; // Background image URL
  achievement: number; // Percentage
}

export interface TechStackData {
  tags: string[];
  learning: string;
}

export interface HealthData {
  steps: number;
  sleep: string;
}

export interface SubscriptionService {
  name: string;
  icon: string; // Icon name from lucide-react
  color: string; // Tailwind color class
}

export interface SubscriptionsData {
  services: SubscriptionService[];
  totalPerMonth: string;
}

export interface ServerMetrics {
  cpu: number;
  ram: number;
  ping: number;
  uptime: string;
}

/**
 * Complete Bento grid data structure
 */
export interface BentoData {
  mood: CurrentMoodData;
  github: GitHubData;
  media: MediaItem[];
  steam: SteamData;
  stack: TechStackData;
  health: HealthData;
  subscriptions: SubscriptionsData;
  server: ServerMetrics;
}
