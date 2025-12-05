
export enum Category {
  HOME = 'Home',
  PROJECTS = 'Projects', // New
  GALLERY = 'Gallery',
  DATA = 'My Data'
}

export type FeedFilter = 'All' | 'Articles' | 'Moments' | 'Curated'; // Added Curated

export type Tab =
  | 'overview'
  | 'stats'
  | 'posts'
  | 'moments'
  | 'projects'
  | 'gallery'
  | 'hero'
  | 'data'
  | 'friends'
  | 'subscriptions'
  | 'credentials'
  | 'curated';

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';

export interface Comment {
  id: string;
  username: string;
  content: string;
  date: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string; // Markdown content
  category: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  coverImagePath?: string;
  tags: string[];
  type: 'article';
  likes: number;
  comments: Comment[];
  status?: 'PUBLISHED' | 'DRAFT';
  locale?: 'EN' | 'ZH';
}

export interface MomentImage {
  url: string;
  w?: number;
  h?: number;
  alt?: string;
  previewUrl?: string;
}

export interface Moment {
  id: string;
  content: string;
  images?: (string | MomentImage)[];
  date: string;
  happenedAt?: string;
  tags: string[];
  type: 'moment';
  likes: number;
  comments: Comment[];
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  status?: 'PUBLISHED' | 'DRAFT';
}

// New Type: For Daily Shares / Curations (Websites, Products, Stuff)
export interface ShareItem {
  id: string;
  title: string;
  description: string;
  url: string;
  domain: string; // e.g., "github.com" or "youtube.com"
  imageUrl?: string;
  date: string;
  tags: string[];
  type: 'share';
  likes: number;
}

export type FeedItem = BlogPost | Moment | ShareItem;

// New Type: For Portfolio Projects
export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  technologies: string[];
  demoUrl?: string;
  repoUrl?: string;
  date: string;
  featured?: boolean;
  // New detailed fields
  role?: string;
  year?: string;
  features?: string[];
  stats?: { label: string; value: string }[];
}

// --- Gallery Types ---
export interface ExifData {
  camera: string;
  lens: string;
  aperture: string;
  iso: string;
  shutter: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string; // For videos
  title: string;
  description?: string;
  date: string;
  location?: string;
  exif?: ExifData;
  width?: number;
  height?: number;
  // API fields
  filePath?: string;
  microThumbPath?: string;
  smallThumbPath?: string;
  mediumPath?: string;
  category?: 'REPOST' | 'ORIGINAL' | 'AI';
  locationName?: string;
  capturedAt?: string;
}

// --- Loading/Error State Types ---
export type LoadingState = Record<string, boolean>;
export type ErrorState = Record<string, string | null>;

// --- Life Log Data Types ---
export interface MovieData {
  month: string;
  movies: number;
  series: number;
}

export interface GameGenreData {
  subject: string;
  A: number; // Hours played
  fullMark: number;
}

export interface SkillData {
  name: string;
  level: number; // 0-100
}

export interface PhotoStatsData {
  day: string;
  count: number;
}

export interface RoutineData {
  name: string;
  value: number; // hours or percentage
  color: string;
}

export interface StepData {
  day: string;
  steps: number;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

// --- Traffic Analytics Types ---
export interface TrafficData {
  date: string;
  visits: number;
  unique: number;
  [key: string]: any;
}

export interface SourceData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface PageVisitData {
  path: string;
  title: string;
  visits: number;
}

export interface DeviceData {
  name: string;
  value: number;
  color: string;
}

// --- Friends Module ---
export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  cover?: string;
  description?: string;
  createdAt: string;
  // passphrase is only returned on create/reset
}

// --- Hero Module ---
export interface HeroImage {
  id: string;
  url: string;
  sortOrder: number;
  active: boolean;
}

// Hero Image Source Types (for image selection)
export type HeroImageSource = 'post' | 'moment' | 'gallery';

export interface SourceImage {
  id: string;
  url: string;           // WebP thumbnail for display
  originalUrl: string;   // Original image URL
  source: HeroImageSource;
  sourceId: string;      // ID of the source (post/moment/gallery)
  title?: string;        // Image title or content excerpt
  createdAt: string;
  isSelected: boolean;   // Whether already added to Hero
}

// --- Subscription Module ---
export type Currency = 'CNY' | 'USD' | 'JPY' | 'HKD';
export type Cycle = 'monthly' | 'yearly' | 'one-time';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  cycle: Cycle;
  category: string; // e.g., "Software", "Streaming", "Hosting"
  description?: string;
  nextBilling?: string;
  icon?: string; // URL or name
  active: boolean;
  startDate?: string;
  endDate?: string | null;
  notes?: string;
}

// --- Credentials & Sync Module ---
export type Platform =
  | 'Bilibili'
  | 'Douban'
  | 'Steam'
  | 'GitHub'
  | 'Spotify'
  | 'Nintendo'
  | 'Hoyoverse'
  | 'Jellyfin';

export interface Credential {
  id: string;
  platform: Platform;
  name: string; // e.g. "My Main Account"
  identifier: string; // Encrypted/Masked value
  type: 'cookie' | 'token' | 'api_key';
  status: 'active' | 'expired' | 'error';
  lastSync?: string;
  failureCount: number;
  isValid?: boolean;
  usageCount?: number;
  lastValidatedAt?: string | null;
  lastUsedAt?: string | null;
  autoSync?: boolean;
  syncFrequency?: string | null;
  nextCheckAt?: string | null;
  lastError?: string | null;
}

export interface SyncJob {
  id: string;
  credentialId: string;
  platform: Platform;
  status: 'success' | 'failed' | 'running';
  itemsProcessed: number;
  durationMs: number;
  timestamp: string;
  logs: string[]; // Simple string logs
}
