"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { BlogPost, Moment, MomentImage, MovieData, GameGenreData, SkillData, Theme, Language, GalleryItem, PhotoStatsData, RoutineData, StepData, Project, ShareItem, TrafficData, SourceData, PageVisitData, DeviceData, Friend, HeroImage, Subscription, Credential, SyncJob, Platform, Currency, LoadingState, ErrorState } from './types';
import { MOVIE_DATA, GAME_GENRE_DATA } from './constants';

// --- Translations ---
const TRANSLATIONS = {
    en: {
        'Home': 'Home',
        'Articles': 'Articles',
        'Moments': 'Moments',
        'Gallery': 'Gallery',
        'Life Log': 'Life Log',
        'Dashboard': 'Life Log',
        'Projects': 'Projects',
        'Login': 'Login',
        'Logout': 'Logout',
        'My Data': 'Life Log',
        'Latest Updates': 'Latest Updates',
        'Mixed Feed': 'Mixed Feed',
        'Curated': 'Curated',
        'At a Glance': 'At a Glance',
        'Designed with': 'Designed with',
        'Read More': 'Read More',
        'min read': 'min read',
        'Just now': 'Just now',
        'Welcome Back': 'Welcome Back',
        'Join Zhi': 'Join Zhi',
        'Sign In': 'Sign In',
        'Create Account': 'Create Account',
        'Username': 'Username',
        'Password': 'Password',
        'Login / Sign up': 'Login / Sign up',
        'Better every day': 'Better every day',
        "Let's change": "Let's change",
        "it up a bit": "it up a bit",
        "Welcome to my digital garden...": "Welcome to my digital garden. I'm a Product Manager capturing light, exploring tech, and sharing the small data of my daily life.",
        'Watching': 'Watching',
        'Playing': 'Playing',
        'Focus': 'Focus',
        'Current learning priority': 'Current learning priority',
        'Recent Snapshots': 'Recent Snapshots',
        'Shuffle': 'Shuffle',
        'No content found here yet.': 'No content found here yet.',
        'Search': 'Search',
        'Admin': 'Admin',
        'Close': 'Close',
        'Settings': 'Settings',
        'Language': 'Language',
        'Theme': 'Theme',
        'Dark': 'Dark',
        'Light': 'Light',
        'All': 'All',
        'Filter': 'Filter',
        'Camera': 'Camera',
        'Lens': 'Lens',
        'Aperture': 'Aperture',
        'ISO': 'ISO',
        'Shutter': 'Shutter',
        'Location': 'Location',
        'Video': 'Video',
        'Shutter Count': 'Shutter Count',
        'Daily Photos Taken': 'Daily Photos Taken',
        'The Balance': 'The Balance',
        'Weekly Routine': 'Weekly Routine',
        'The Journey': 'The Journey',
        'Daily Steps': 'Daily Steps',
        'The Output': 'The Output',
        'Media Diet': 'Media Diet',
        'Movies & Games': 'Movies & Games',
        'Quantifying the hobbies that keep me sane.': 'Quantifying the habits that make me, me.',
        'About Me': 'About Me',
        'Product Manager': 'Product Manager',
        'Photographer': '独立摄影',
        'Tech Enthusiast': '数码玩家',
        'Get in Touch': 'Get in Touch',
        'Live Demo': 'Live Demo',
        'Source Code': 'Source Code',
        'Selected Projects': 'Selected Projects',
        'A collection of my digital creations.': 'A collection of my digital creations.'
    },
    zh: {
        'Home': '首页',
        'Articles': '文章',
        'Moments': '瞬间',
        'Gallery': '影像馆',
        'Life Log': '生活日志',
        'Dashboard': '生活日志',
        'Projects': '项目',
        'Login': '登录',
        'Logout': '登出',
        'My Data': '生活数据',
        'Latest Updates': '最新动态',
        'Mixed Feed': '混合流',
        'Curated': '精选',
        'At a Glance': '概览',
        'Designed with': '设计',
        'Read More': '阅读更多',
        'min read': '分钟阅读',
        'Just now': '刚刚',
        'Welcome Back': '欢迎回来',
        'Join Zhi': '加入 Zhi',
        'Sign In': '登录',
        'Create Account': '创建账户',
        'Username': '用户名',
        'Password': '密码',
        'Login / Sign up': '登录 / 注册',
        'Better every day': '日日精进',
        "Let's change": "尝试一些",
        "it up a bit": "新鲜事物",
        "Welcome to my digital garden...": "欢迎来到我的数字花园。我是产品经理，在这里捕捉光影、探索科技，并分享我日常生活中的小数据。",
        'Watching': '观影',
        'Playing': '在玩',
        'Focus': '关注',
        'Current learning priority': '当前学习重点',
        'Recent Snapshots': '近期快照',
        'Shuffle': '随机切换',
        'No content found here yet.': '暂无内容',
        'Search': '搜索',
        'Admin': '管理',
        'Close': '关闭',
        'Settings': '设置',
        'Language': '语言',
        'Theme': '主题',
        'Dark': '深色',
        'Light': '浅色',
        'All': '全部',
        'Filter': '筛选',
        'Camera': '相机',
        'Lens': '镜头',
        'Aperture': '光圈',
        'ISO': 'ISO',
        'Shutter': '快门',
        'Location': '地点',
        'Video': '视频',
        'Shutter Count': '快门计数',
        'Daily Photos Taken': '每日拍摄数量',
        'The Balance': '平衡',
        'Weekly Routine': '每周例程',
        'The Journey': '旅程',
        'Daily Steps': '每日步数',
        'The Output': '产出',
        'Media Diet': '精神食粮',
        'Movies & Games': '影视与游戏',
        'Quantifying the hobbies that keep me sane.': '量化构成自我的每一个习惯。',
        'About Me': '关于我',
        'Product Manager': '产品经理',
        'Photographer': '独立摄影',
        'Tech Enthusiast': '数码玩家',
        'Get in Touch': '保持联系',
        'Live Demo': '在线演示',
        'Source Code': '源代码',
        'Selected Projects': '精选项目',
        'A collection of my digital creations.': '展示我的数字创造与实验。'
    }
};

// --- API Helpers ---
type ApiCredential = {
    id: string;
    platform: string;
    type: string;
    isValid?: boolean;
    usageCount?: number;
    failureCount?: number;
    lastValidatedAt?: string | null;
    lastUsedAt?: string | null;
    metadata?: Record<string, unknown> | null;
    autoSync?: boolean;
    syncFrequency?: string | null;
    nextCheckAt?: string | null;
    lastError?: string | null;
    updatedAt?: string;
    createdAt?: string;
};

type ApiSubscription = {
    id: string;
    name: string;
    currency: string;
    amount: number;
    billingCycle: string;
    startDate: string;
    endDate: string | null;
    notes?: string | null;
};

export function mapToPrismaCredentialPlatform(key: string): CredentialPlatform {
    const lower = key.toLowerCase();
    if (lower === 'steam') return 'STEAM';
    if (lower === 'hoyoverse' || lower === 'mihoyo') return 'HOYOVERSE';
    if (lower === 'bilibili' || lower === 'bili') return 'BILIBILI';
    if (lower === 'douban') return 'DOUBAN';
    if (key === 'spotify') return 'SPOTIFY'; // Assuming CredentialPlatform has SPOTIFY
    if (key === 'nintendo') return 'NINTENDO'; // Assuming CredentialPlatform has NINTENDO
    if (lower === 'github') return 'GITHUB';
    if (lower === 'jellyfin') return 'JELLYFIN';
    if (lower === 'deepseek') return 'DEEPSEEK';
    return key as CredentialPlatform;
}

const platformToUi = (platform: string): Platform => {
    const key = platform.toLowerCase();
    if (key === 'steam') return 'Steam';
    if (key === 'bilibili') return 'Bilibili';
    if (key === 'douban') return 'Douban';
    if (key === 'github') return 'GitHub';
    if (key === 'spotify') return 'Spotify';
    if (key === 'nintendo') return 'Nintendo';
    if (key === 'hoyoverse') return 'Hoyoverse';
    if (key === 'jellyfin') return 'Jellyfin';
    if (key === 'deepseek') return 'DeepSeek';
    return (platform || 'Unknown') as Platform;
};

const platformToApi = (platform?: Platform | string) => {
    const key = (platform ?? '').toLowerCase();
    switch (key) {
        case 'steam': return 'STEAM';
        case 'bilibili': return 'BILIBILI';
        case 'douban': return 'DOUBAN';
        case 'github': return 'GITHUB';
        case 'spotify': return 'SPOTIFY';
        case 'nintendo': return 'NINTENDO';
        case 'hoyoverse': return 'HOYOVERSE';
        case 'jellyfin': return 'JELLYFIN';
        case 'deepseek': return 'DEEPSEEK';
        default: return (platform ?? '').toUpperCase();
    }
};

const credentialTypeToUi = (type: string): Credential['type'] => {
    const key = type.toLowerCase();
    if (key === 'cookie') return 'cookie';
    if (key === 'api_key' || key === 'api-key') return 'api_key';
    return 'token';
};

const credentialTypeToApi = (type?: Credential['type'] | string) => {
    const key = (type ?? '').toLowerCase();
    if (key === 'cookie') return 'COOKIE';
    if (key === 'api_key' || key === 'api-key') return 'API_KEY';
    return 'OAUTH_TOKEN';
};

const mapApiCredential = (c: ApiCredential): Credential => {
    const meta = (c.metadata && typeof c.metadata === 'object') ? c.metadata : {};
    const label = typeof (meta as any)?.label === 'string' ? (meta as any).label : '';
    const identifier = typeof (meta as any)?.identifier === 'string' ? (meta as any).identifier : '';

    return {
        id: c.id,
        platform: platformToUi(c.platform),
        name: label || platformToUi(c.platform),
        identifier,
        type: credentialTypeToUi(c.type),
        status: c.isValid === false ? 'error' : 'active',
        lastSync: c.lastValidatedAt ?? c.lastUsedAt ?? c.updatedAt ?? undefined,
        failureCount: c.failureCount ?? 0,
        isValid: c.isValid,
        usageCount: c.usageCount,
        lastValidatedAt: c.lastValidatedAt ?? null,
        lastUsedAt: c.lastUsedAt ?? null,
        autoSync: c.autoSync,
        syncFrequency: c.syncFrequency ?? null,
        nextCheckAt: c.nextCheckAt ?? null,
        lastError: c.lastError ?? null,
    };
};

const mapApiSubscription = (s: ApiSubscription): Subscription => {
    const cycleMap: Record<string, Subscription['cycle']> = {
        MONTHLY: 'monthly',
        ANNUAL: 'yearly',
        ONE_TIME: 'one-time',
    };
    const cycle = cycleMap[s.billingCycle] ?? 'monthly';
    const active = !s.endDate || new Date(s.endDate).getTime() > Date.now();
    return {
        id: s.id,
        name: s.name,
        price: s.amount,
        currency: (s.currency?.toUpperCase?.() ?? 'CNY') as Currency,
        cycle,
        category: s.notes || 'General',
        description: '',
        nextBilling: s.endDate ?? undefined,
        active,
        startDate: s.startDate,
        endDate: s.endDate,
        notes: s.notes ?? undefined,
    };
};

const buildSubscriptionPayload = (sub: Subscription) => {
    const cycleMap: Record<Subscription['cycle'], string> = {
        monthly: 'MONTHLY',
        yearly: 'ANNUAL',
        'one-time': 'ONE_TIME',
    };
    const startDate = sub.startDate ? new Date(sub.startDate) : new Date();
    const endDate = sub.active === false
        ? new Date()
        : sub.endDate
            ? new Date(sub.endDate)
            : null;

    return {
        name: (sub.name || 'Untitled').trim(),
        currency: (sub.currency || 'CNY').toUpperCase(),
        amount: Number(sub.price) || 0,
        billingCycle: cycleMap[sub.cycle] ?? 'MONTHLY',
        startDate,
        endDate,
        notes: sub.notes ?? sub.category ?? '',
    };
};

const buildCredentialPayload = (c: Credential, includeValue = true) => {
    const metadata: Record<string, unknown> = {};
    if (c.name) metadata.label = c.name;
    if (c.identifier) metadata.identifier = c.identifier;

    return {
        platform: platformToApi(c.platform),
        type: credentialTypeToApi(c.type),
        ...(includeValue && c.identifier ? { value: c.identifier } : {}),
        ...(Object.keys(metadata).length ? { metadata } : {}),
    };
};

// --- Settings Context ---
interface SettingsContextType {
    theme: Theme;
    toggleTheme: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

type GalleryUploadInput = {
    file?: File;
    manualUrl?: string;
    title?: string;
    description?: string;
    date?: string;
    category?: 'REPOST' | 'ORIGINAL' | 'AI';
};

type GalleryUpdateInput = GalleryUploadInput & { id: string };

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    // Always start with 'en' on both server and client to avoid hydration mismatch
    const [language, setLanguageState] = useState<Language>('en');
    // Track if we've hydrated to avoid flash
    const [_isHydrated, setIsHydrated] = useState(false);

    // Read saved language from sessionStorage AFTER hydration
    // Using a callback ref pattern instead of synchronous setState in effect
    useEffect(() => {
        // Schedule the state update for the next tick to avoid cascading renders
        const savedLanguage = sessionStorage.getItem('admin-language');
        const updateLanguage = () => {
            if (savedLanguage === 'zh' || savedLanguage === 'en') {
                setLanguageState(savedLanguage);
            }
            setIsHydrated(true);
        };
        // Use requestAnimationFrame to defer state updates
        const rafId = requestAnimationFrame(updateLanguage);
        return () => cancelAnimationFrame(rafId);
    }, []);

    // Apply theme to html
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Persist language to sessionStorage
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        sessionStorage.setItem('admin-language', lang);
    };

    const t = (key: string) => {
        // @ts-ignore
        return TRANSLATIONS[language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};

// --- Data Context ---
interface DataContextType {
    // Loading and Error States
    loading: LoadingState;
    errors: ErrorState;

    posts: BlogPost[];
    moments: Moment[];
    shareItems: ShareItem[];
    projects: Project[];
    galleryItems: GalleryItem[];
    movieData: MovieData[];
    gameData: GameGenreData[];
    skillData: SkillData[];
    photoStats: PhotoStatsData[];
    routineData: RoutineData[];
    stepsData: StepData[];
    heroImages: HeroImage[];

    // Traffic Stats
    trafficData: TrafficData[];
    sourceData: SourceData[];
    pageVisitData: PageVisitData[];
    deviceData: DeviceData[];

    // NEW MODULES
    friends: Friend[];
    subscriptions: Subscription[];
    credentials: Credential[];
    syncJobs: SyncJob[];

    // --- CRUD Actions ---
    addPost: (post: BlogPost) => Promise<void>;
    updatePost: (post: BlogPost) => Promise<void>;
    deletePost: (id: string) => Promise<void>;

    addMoment: (moment: Moment) => Promise<void>;
    updateMoment: (moment: Moment) => Promise<void>;
    deleteMoment: (id: string) => Promise<void>;

    addProject: (project: Project) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    addShareItem: (item: ShareItem) => Promise<void>;
    updateShareItem: (item: ShareItem) => Promise<void>;
    deleteShareItem: (id: string) => Promise<void>;

    addGalleryItem: (item: GalleryUploadInput) => Promise<void>;
    updateGalleryItem: (item: GalleryUpdateInput) => Promise<void>;
    deleteGalleryItem: (id: string) => Promise<void>;

    // Hero Actions
    addHeroImage: (image: Partial<HeroImage>) => Promise<void>;
    updateHeroImage: (image: HeroImage) => Promise<void>;
    deleteHeroImage: (id: string) => Promise<void>;

    // Friends Actions (with passphrase return)
    addFriend: (f: Partial<Friend>) => Promise<{ friend: Friend; passphrase?: string }>;
    updateFriend: (f: Friend) => Promise<void>;
    deleteFriend: (id: string) => Promise<void>;
    resetFriendPassword: (id: string) => Promise<string>;

    addSubscription: (s: Subscription) => void;
    updateSubscription: (s: Subscription) => void;
    deleteSubscription: (id: string) => void;

    addCredential: (c: Credential) => void;
    updateCredential: (c: Credential) => void;
    deleteCredential: (id: string) => void;
    triggerSync: (credentialId: string) => Promise<void>;

    // Data Setters
    updateMovieData: (data: MovieData[]) => void;
    updateGameData: (data: GameGenreData[]) => void;
    updateSkillData: (data: SkillData[]) => void;
    updatePhotoStats: (data: PhotoStatsData[]) => void;
    updateRoutineData: (data: RoutineData[]) => void;
    updateStepsData: (data: StepData[]) => void;
    saveLifeData: () => Promise<void>;

    // Social Actions
    toggleLike: (id: string, type: 'article' | 'moment' | 'share') => void;
    addComment: (id: string, type: 'article' | 'moment', text: string, username: string) => void;

    // Refresh functions
    refreshPosts: () => Promise<void>;
    refreshMoments: () => Promise<void>;
    refreshProjects: () => Promise<void>;
    refreshShareItems: () => Promise<void>;
    refreshGallery: () => Promise<void>;
    refreshHeroImages: () => Promise<void>;
    refreshFriends: () => Promise<void>;
    refreshAnalytics: (period?: '7d' | '30d' | '90d' | 'all') => Promise<void>;
    refreshLifeData: () => Promise<void>;

    // Utils
    convertCurrency: (amount: number, from: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Loading and Error States
    const [loading, setLoading] = useState<LoadingState>({});
    const [errors, setErrors] = useState<ErrorState>({});

    const setLoadingFor = (key: string, value: boolean) => {
        setLoading(prev => ({ ...prev, [key]: value }));
    };

    const setErrorFor = (key: string, error: string | null) => {
        setErrors(prev => ({ ...prev, [key]: error }));
    };

    const handleApiError = (error: unknown, context: string) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`${context}:`, error);
        setErrorFor(context, message);
    };

    // Start empty to avoid flashing placeholder/mock data when switching tabs
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [moments, setMoments] = useState<Moment[]>([]);
    const [shareItems, setShareItems] = useState<ShareItem[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [movieData, setMovieData] = useState<MovieData[]>(MOVIE_DATA);
    const [gameData, setGameData] = useState<GameGenreData[]>(GAME_GENRE_DATA);
    const [skillData, setSkillData] = useState<SkillData[]>([]);
    const [photoStats, setPhotoStats] = useState<PhotoStatsData[]>([]);
    const [routineData, setRoutineData] = useState<RoutineData[]>([]);
    const [stepsData, setStepsData] = useState<StepData[]>([]);
    const [heroImages, setHeroImages] = useState<HeroImage[]>([]);

    // Traffic Stats State
    const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
    const [sourceData, setSourceData] = useState<SourceData[]>([]);
    const [pageVisitData, setPageVisitData] = useState<PageVisitData[]>([]);
    const [deviceData, setDeviceData] = useState<DeviceData[]>([]);

    // NEW MODULES STATE
    const [friends, setFriends] = useState<Friend[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);

    // --- API Mapping Functions ---
    const mapApiPost = (p: any): BlogPost => ({
        id: p.id,
        title: p.title || '',
        excerpt: p.excerpt || '',
        content: p.content || '',
        category: p.category || 'General',
        date: p.publishedAt || p.createdAt || new Date().toISOString(),
        readTime: p.readTime || '5 min',
        imageUrl: p.coverImagePath || p.imageUrl,
        coverImagePath: p.coverImagePath,
        tags: p.tags || [],
        type: 'article',
        likes: p.likes || 0,
        comments: p.comments || [],
        status: p.status || 'DRAFT',
        locale: (p.locale || 'EN').toUpperCase() as 'EN' | 'ZH',
    });

    const mapApiMoment = (m: any): Moment => ({
        id: m.id,
        content: m.content || '',
        images: m.images || [],
        date: m.createdAt || new Date().toISOString(),
        happenedAt: m.happenedAt,
        tags: m.tags || [],
        type: 'moment',
        likes: m.likes || 0,
        comments: m.comments || [],
        visibility: m.visibility || 'PUBLIC',
        status: m.status || 'PUBLISHED',
    });

    const mapApiProject = (p: any): Project => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        technologies: p.technologies || [],
        demoUrl: p.demoUrl,
        repoUrl: p.repoUrl,
        date: p.createdAt || new Date().toISOString(),
        featured: p.featured || false,
        role: p.role,
        year: p.year,
        features: p.features || [],
        stats: p.stats || [],
    });

    const mapApiShareItem = (s: any): ShareItem => ({
        id: s.id,
        title: s.title || '',
        description: s.description || '',
        url: s.url || '',
        domain: s.domain || new URL(s.url || 'https://example.com').hostname,
        imageUrl: s.imageUrl,
        date: s.createdAt || new Date().toISOString(),
        tags: s.tags || [],
        type: 'share',
        likes: s.likes || 0,
    });

    const mapApiGalleryItem = (g: any): GalleryItem => ({
        id: g.id,
        type: 'image',
        url: g.filePath || g.url || '',
        thumbnail: g.smallThumbPath || g.microThumbPath,
        title: g.title || '',
        description: g.description,
        date: g.capturedAt || g.createdAt || new Date().toISOString(),
        location: g.locationName,
        filePath: g.filePath,
        microThumbPath: g.microThumbPath,
        smallThumbPath: g.smallThumbPath,
        mediumPath: g.mediumPath,
        category: g.category || 'ORIGINAL',
        locationName: g.locationName,
        capturedAt: g.capturedAt,
        width: g.width,
        height: g.height,
    });

    const mapApiHeroImage = (h: any): HeroImage => ({
        id: h.id,
        url: h.url || '',
        sortOrder: h.sortOrder || 0,
        active: h.active !== false,
    });

    const mapApiFriend = (f: any): Friend => ({
        id: f.id,
        name: f.name || '',
        avatar: f.avatar,
        cover: f.cover,
        description: f.description,
        createdAt: f.createdAt || new Date().toISOString(),
    });

    // --- Fetch Functions ---
    const refreshPosts = async () => {
        setLoadingFor('posts', true);
        setErrorFor('posts', null);
        try {
            const res = await fetch('/api/admin/posts', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setPosts(data.map(mapApiPost));
                return;
            }
            if (res.status === 401) throw new Error('Unauthorized');
        } catch (error) {
            handleApiError(error, 'posts');
            // Fallback to public posts if admin endpoint fails (e.g., no auth)
            try {
                const res = await fetch('/api/posts', { cache: 'no-store' });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
                    setPosts(data.map(mapApiPost));
                }
            } catch (fallbackError) {
                handleApiError(fallbackError, 'posts');
            }
        } finally {
            setLoadingFor('posts', false);
        }
    };

    const refreshMoments = async () => {
        setLoadingFor('moments', true);
        setErrorFor('moments', null);
        try {
            const res = await fetch('/api/admin/moments', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.moments)) {
                setMoments(data.moments.map(mapApiMoment));
            }
        } catch (error) {
            handleApiError(error, 'moments');
        } finally {
            setLoadingFor('moments', false);
        }
    };

    const refreshProjects = async () => {
        setLoadingFor('projects', true);
        setErrorFor('projects', null);
        try {
            const res = await fetch('/api/admin/projects', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.projects)) {
                setProjects(data.projects.map(mapApiProject));
            }
        } catch (error) {
            handleApiError(error, 'projects');
        } finally {
            setLoadingFor('projects', false);
        }
    };

    const refreshShareItems = async () => {
        setLoadingFor('curated', true);
        setErrorFor('curated', null);
        try {
            const res = await fetch('/api/admin/curated', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.items)) {
                setShareItems(data.items.map(mapApiShareItem));
            }
        } catch (error) {
            handleApiError(error, 'curated');
        } finally {
            setLoadingFor('curated', false);
        }
    };

    const refreshGallery = async () => {
        setLoadingFor('gallery', true);
        setErrorFor('gallery', null);
        try {
            const res = await fetch('/api/admin/gallery', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.images)) {
                setGalleryItems(data.images.map(mapApiGalleryItem));
            }
        } catch (error) {
            handleApiError(error, 'gallery');
        } finally {
            setLoadingFor('gallery', false);
        }
    };

    const refreshHeroImages = async () => {
        setLoadingFor('hero', true);
        setErrorFor('hero', null);
        try {
            const res = await fetch('/api/admin/hero', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.images)) {
                setHeroImages(data.images.map(mapApiHeroImage));
            }
        } catch (error) {
            handleApiError(error, 'hero');
        } finally {
            setLoadingFor('hero', false);
        }
    };

    const refreshFriends = async () => {
        setLoadingFor('friends', true);
        setErrorFor('friends', null);
        try {
            const res = await fetch('/api/admin/friends', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.friends)) {
                setFriends(data.friends.map(mapApiFriend));
            }
        } catch (error) {
            handleApiError(error, 'friends');
        } finally {
            setLoadingFor('friends', false);
        }
    };

    const refreshAnalytics = async (period: '7d' | '30d' | '90d' | 'all' = '30d') => {
        setLoadingFor('analytics', true);
        setErrorFor('analytics', null);
        try {
            const res = await fetch(`/api/admin/analytics/overview?period=${period}`, { cache: 'no-store' });
            const data = await res.json();
            if (res.ok) {
                if (Array.isArray(data.trafficData)) setTrafficData(data.trafficData);
                if (Array.isArray(data.sourceData)) setSourceData(data.sourceData);
                if (Array.isArray(data.pageVisitData)) setPageVisitData(data.pageVisitData);
                if (Array.isArray(data.deviceData)) setDeviceData(data.deviceData);
            }
        } catch (error) {
            handleApiError(error, 'analytics');
        } finally {
            setLoadingFor('analytics', false);
        }
    };

    const refreshLifeData = async () => {
        setLoadingFor('lifeData', true);
        setErrorFor('lifeData', null);
        try {
            const res = await fetch('/api/admin/life-data', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok) {
                if (Array.isArray(data.skills)) setSkillData(data.skills);
                if (Array.isArray(data.routines)) setRoutineData(data.routines);
                if (Array.isArray(data.steps)) setStepsData(data.steps);
                if (Array.isArray(data.photoStats)) setPhotoStats(data.photoStats);
                // movieData and gameData remain mock data per user requirement
            }
        } catch (error) {
            handleApiError(error, 'lifeData');
        } finally {
            setLoadingFor('lifeData', false);
        }
    };

    const saveLifeData = async () => {
        setLoadingFor('lifeData', true);
        setErrorFor('lifeData', null);
        try {
            const res = await fetch('/api/admin/life-data', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: skillData,
                    routines: routineData,
                    steps: stepsData,
                    photoStats: photoStats,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to save life data');
            }
        } catch (error) {
            handleApiError(error, 'lifeData');
        } finally {
            setLoadingFor('lifeData', false);
        }
    };

    const fetchCredentials = async () => {
        try {
            const res = await fetch('/api/admin/credentials', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.credentials)) {
                setCredentials(data.credentials.map((c: ApiCredential) => mapApiCredential(c)));
            }
        } catch (error) {
            console.error('Failed to load credentials', error);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('/api/subscriptions', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.subscriptions)) {
                setSubscriptions(data.subscriptions.map((s: ApiSubscription) => mapApiSubscription(s)));
            }
        } catch (error) {
            console.error('Failed to load subscriptions', error);
        }
    };

    // Load all data on mount
    useEffect(() => {
        void refreshPosts();
        void refreshMoments();
        void refreshProjects();
        void refreshShareItems();
        void refreshGallery();
        void refreshHeroImages();
        void refreshFriends();
        void refreshAnalytics();
        void refreshLifeData();
        void fetchCredentials();
        void fetchSubscriptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- CRUD Operations ---

    // Posts
    const addPost = async (post: BlogPost) => {
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: post.title,
                    excerpt: post.excerpt,
                    content: post.content || '',
                    category: post.category,
                    tags: post.tags,
                    coverImagePath: post.coverImagePath,
                    status: post.status || 'DRAFT',
                    locale: post.locale || 'EN',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                // Handle both error formats: { error: "..." } and { message: "...", errors: {...} }
                const errorMsg = data.error || data.message || 'Failed to create post';
                const validationErrors = data.errors ? Object.values(data.errors).join(', ') : '';
                throw new Error(validationErrors || errorMsg);
            }
            setPosts(prev => [mapApiPost(data), ...prev]);
        } catch (error) {
            handleApiError(error, 'posts');
            throw error;
        }
    };

    const updatePost = async (updated: BlogPost) => {
        try {
            const res = await fetch(`/api/admin/posts/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updated.title,
                    excerpt: updated.excerpt,
                    content: updated.content || '',
                    category: updated.category,
                    tags: updated.tags,
                    coverImagePath: updated.coverImagePath,
                    status: updated.status || 'DRAFT',
                    locale: updated.locale || 'EN',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                // Handle both error formats: { error: "..." } and { message: "...", errors: {...} }
                const errorMsg = data.error || data.message || 'Failed to update post';
                const validationErrors = data.errors ? Object.values(data.errors).join(', ') : '';
                throw new Error(validationErrors || errorMsg);
            }
            setPosts(prev => prev.map(p => p.id === updated.id ? mapApiPost(data) : p));
        } catch (error) {
            handleApiError(error, 'posts');
            throw error;
        }
    };

    const deletePost = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete post');
            }
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            handleApiError(error, 'posts');
            throw error;
        }
    };

    // Validate image URL - reject blob URLs which are temporary browser-only URLs
    const isValidImageUrl = (url: string): boolean => {
        if (!url) return false;
        // Reject blob URLs - they won't work on server
        if (url.startsWith('blob:')) {
            console.warn('[Admin] Filtering out blob URL:', url);
            return false;
        }
        // Only allow valid URL patterns
        return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    };

    const serializeMomentImages = (images?: (string | MomentImage)[]) => (images || [])
        .map(img => (
            typeof img === 'string'
                ? { url: img }
                : {
                    url: img.url,
                    w: img.w,
                    h: img.h,
                    alt: img.alt,
                    previewUrl: img.previewUrl
                }
        ))
        .filter(img => isValidImageUrl(img.url));

    // Moments
    const addMoment = async (moment: Moment) => {
        try {
            const res = await fetch('/api/admin/moments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: moment.content,
                    images: serializeMomentImages(moment.images),
                    tags: (moment.tags || []).map(tag => tag.trim()).filter(Boolean),
                    visibility: moment.visibility || 'PUBLIC',
                    status: moment.status || 'PUBLISHED',
                    happenedAt: moment.happenedAt,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create moment');
            setMoments(prev => [mapApiMoment(data.moment || data), ...prev]);
        } catch (error) {
            handleApiError(error, 'moments');
            throw error;
        }
    };

    const updateMoment = async (updated: Moment) => {
        try {
            const res = await fetch(`/api/admin/moments/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: updated.content,
                    images: serializeMomentImages(updated.images),
                    tags: (updated.tags || []).map(tag => tag.trim()).filter(Boolean),
                    visibility: updated.visibility || 'PUBLIC',
                    status: updated.status || 'PUBLISHED',
                    happenedAt: updated.happenedAt,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update moment');
            setMoments(prev => prev.map(m => m.id === updated.id ? mapApiMoment(data.moment || data) : m));
        } catch (error) {
            handleApiError(error, 'moments');
            throw error;
        }
    };

    const deleteMoment = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/moments/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete moment');
            }
            setMoments(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            handleApiError(error, 'moments');
            throw error;
        }
    };

    // Projects
    const addProject = async (project: Project) => {
        try {
            const res = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: project.title,
                    description: project.description,
                    imageUrl: project.imageUrl,
                    technologies: project.technologies,
                    demoUrl: project.demoUrl,
                    repoUrl: project.repoUrl,
                    featured: project.featured,
                    role: project.role,
                    year: project.year,
                    features: project.features,
                    stats: project.stats,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create project');
            setProjects(prev => [mapApiProject(data.project || data), ...prev]);
        } catch (error) {
            handleApiError(error, 'projects');
            throw error;
        }
    };

    const updateProject = async (updated: Project) => {
        try {
            const res = await fetch(`/api/admin/projects/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updated.title,
                    description: updated.description,
                    imageUrl: updated.imageUrl,
                    technologies: updated.technologies,
                    demoUrl: updated.demoUrl,
                    repoUrl: updated.repoUrl,
                    featured: updated.featured,
                    role: updated.role,
                    year: updated.year,
                    features: updated.features,
                    stats: updated.stats,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update project');
            setProjects(prev => prev.map(p => p.id === updated.id ? mapApiProject(data.project || data) : p));
        } catch (error) {
            handleApiError(error, 'projects');
            throw error;
        }
    };

    const deleteProject = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete project');
            }
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            handleApiError(error, 'projects');
            throw error;
        }
    };

    // Share Items (Curated)
    const addShareItem = async (item: ShareItem) => {
        try {
            const res = await fetch('/api/admin/curated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    imageUrl: item.imageUrl,
                    tags: item.tags,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create curated item');
            setShareItems(prev => [mapApiShareItem(data.item || data), ...prev]);
        } catch (error) {
            handleApiError(error, 'curated');
            throw error;
        }
    };

    const updateShareItem = async (updated: ShareItem) => {
        try {
            const res = await fetch(`/api/admin/curated/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updated.title,
                    description: updated.description,
                    url: updated.url,
                    imageUrl: updated.imageUrl,
                    tags: updated.tags,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update curated item');
            setShareItems(prev => prev.map(s => s.id === updated.id ? mapApiShareItem(data.item || data) : s));
        } catch (error) {
            handleApiError(error, 'curated');
            throw error;
        }
    };

    const deleteShareItem = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/curated/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete curated item');
            }
            setShareItems(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            handleApiError(error, 'curated');
            throw error;
        }
    };

    // Gallery
    const resolveGalleryFile = async (item: GalleryUploadInput) => {
        if (item.file) return item.file;
        if (item.manualUrl) {
            const res = await fetch(item.manualUrl);
            if (!res.ok) throw new Error('Failed to fetch image from URL');
            const blob = await res.blob();
            const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(item.manualUrl);
            const ext = match?.[1] || 'jpg';
            return new File([blob], `remote-${Date.now()}.${ext}`, { type: blob.type || 'image/jpeg' });
        }
        throw new Error('Image file is required');
    };

    const addGalleryItem = async (item: GalleryUploadInput) => {
        try {
            const file = await resolveGalleryFile(item);
            const formData = new FormData();
            formData.append('image', file);
            if (item.title) formData.append('title', item.title);
            if (item.description) formData.append('description', item.description);
            if (item.category) formData.append('category', item.category);
            if (item.date) formData.append('capturedAt', item.date);

            const res = await fetch('/api/admin/gallery/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to upload image');
            const mapped = mapApiGalleryItem(data.image || data);
            setGalleryItems(prev => [mapped, ...prev]);
        } catch (error) {
            handleApiError(error, 'gallery');
            throw error;
        }
    };

    const updateGalleryItem = async (updated: GalleryUpdateInput) => {
        try {
            const res = await fetch(`/api/admin/gallery/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updated.title,
                    description: updated.description,
                    category: updated.category,
                    capturedAt: updated.date
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update gallery item');
            const mapped = mapApiGalleryItem(data.image || data);
            setGalleryItems(prev => prev.map(g => g.id === updated.id ? mapped : g));
        } catch (error) {
            handleApiError(error, 'gallery');
            throw error;
        }
    };

    const deleteGalleryItem = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete gallery item');
            }
            setGalleryItems(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            handleApiError(error, 'gallery');
            throw error;
        }
    };

    // Hero Images
    const addHeroImage = async (image: Partial<HeroImage>) => {
        try {
            const res = await fetch('/api/admin/hero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: image.url,
                    sortOrder: image.sortOrder || heroImages.length,
                    active: image.active !== false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create hero image');
            setHeroImages(prev => [...prev, mapApiHeroImage(data.image || data)]);
        } catch (error) {
            handleApiError(error, 'hero');
            throw error;
        }
    };

    const updateHeroImage = async (image: HeroImage) => {
        try {
            const res = await fetch(`/api/admin/hero/${image.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: image.url,
                    sortOrder: image.sortOrder,
                    active: image.active,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update hero image');
            setHeroImages(prev => prev.map(h => h.id === image.id ? mapApiHeroImage(data.image || data) : h));
        } catch (error) {
            handleApiError(error, 'hero');
            throw error;
        }
    };

    const deleteHeroImage = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/hero/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete hero image');
            }
            setHeroImages(prev => prev.filter(h => h.id !== id));
        } catch (error) {
            handleApiError(error, 'hero');
            throw error;
        }
    };

    // --- NEW MODULES CRUD ---
    const addFriend = async (f: Partial<Friend>): Promise<{ friend: Friend; passphrase?: string }> => {
        try {
            const res = await fetch('/api/admin/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: f.name,
                    avatar: f.avatar,
                    cover: f.cover,
                    description: f.description,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create friend');
            const friend = mapApiFriend(data.friend || data);
            setFriends(prev => [friend, ...prev]);
            return { friend, passphrase: data.passphrase };
        } catch (error) {
            handleApiError(error, 'friends');
            throw error;
        }
    };

    const updateFriend = async (f: Friend) => {
        try {
            const res = await fetch(`/api/admin/friends/${f.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: f.name,
                    avatar: f.avatar,
                    cover: f.cover,
                    description: f.description,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update friend');
            setFriends(prev => prev.map(existing => existing.id === f.id ? mapApiFriend(data.friend || data) : existing));
        } catch (error) {
            handleApiError(error, 'friends');
            throw error;
        }
    };

    const deleteFriend = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/friends/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete friend');
            }
            setFriends(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            handleApiError(error, 'friends');
            throw error;
        }
    };

    const resetFriendPassword = async (id: string): Promise<string> => {
        try {
            const res = await fetch(`/api/admin/friends/${id}/reset-password`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reset password');
            return data.passphrase;
        } catch (error) {
            handleApiError(error, 'friends');
            throw error;
        }
    };

    const addSubscription = (s: Subscription) => {
        (async () => {
            try {
                const payload = buildSubscriptionPayload(s);
                const res = await fetch('/api/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok || !data.subscription) throw new Error(data.error || 'Failed to create subscription');
                setSubscriptions(prev => [mapApiSubscription(data.subscription as ApiSubscription), ...prev]);
            } catch (error) {
                console.error('Create subscription failed', error);
            }
        })();
    };

    const updateSubscription = (s: Subscription) => {
        (async () => {
            try {
                const payload = buildSubscriptionPayload(s);
                const res = await fetch(`/api/subscriptions/${s.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok || !data.subscription) throw new Error(data.error || 'Failed to update subscription');
                const mapped = mapApiSubscription(data.subscription as ApiSubscription);
                setSubscriptions(prev => prev.map(existing => existing.id === mapped.id ? mapped : existing));
            } catch (error) {
                console.error('Update subscription failed', error);
            }
        })();
    };

    const deleteSubscription = (id: string) => {
        (async () => {
            try {
                const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to delete subscription');
                }
                setSubscriptions(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error('Delete subscription failed', error);
            }
        })();
    };

    const addCredential = (c: Credential) => {
        (async () => {
            try {
                const payload = buildCredentialPayload(c, Boolean(c.identifier));
                const res = await fetch('/api/admin/credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok || !data.credential) throw new Error(data.error || 'Failed to create credential');
                setCredentials(prev => [mapApiCredential(data.credential as ApiCredential), ...prev]);
            } catch (error) {
                console.error('Create credential failed', error);
            }
        })();
    };

    const updateCredential = (c: Credential) => {
        (async () => {
            try {
                const payload = buildCredentialPayload(c);
                const res = await fetch(`/api/admin/credentials/${c.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok || !data.credential) throw new Error(data.error || 'Failed to update credential');
                const mapped = mapApiCredential(data.credential as ApiCredential);
                setCredentials(prev => prev.map(existing => existing.id === mapped.id ? mapped : existing));
            } catch (error) {
                console.error('Update credential failed', error);
            }
        })();
    };

    const deleteCredential = (id: string) => {
        (async () => {
            try {
                const res = await fetch(`/api/admin/credentials/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to delete credential');
                }
                setCredentials(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error('Delete credential failed', error);
            }
        })();
    };

    const triggerSync = async (credentialId: string) => {
        const cred = credentials.find(c => c.id === credentialId);
        if (!cred) return;

        const jobId = Math.random().toString(36).substr(2, 9);
        const runningJob: SyncJob = {
            id: jobId,
            credentialId: cred.id,
            platform: cred.platform,
            status: 'running',
            itemsProcessed: 0,
            durationMs: 0,
            timestamp: new Date().toISOString(),
            logs: ['Starting sync job...', `Connecting to ${cred.platform}...`]
        };
        setSyncJobs(prev => [runningJob, ...prev]);

        try {
            const startedAt = Date.now();
            const res = await fetch(`/api/admin/credentials/${credentialId}/sync`, { method: 'POST' });
            const data = await res.json();
            const success = res.ok && (data?.success !== false);

            const completedJob: SyncJob = {
                ...runningJob,
                status: success ? 'success' : 'failed',
                itemsProcessed: data?.syncResult?.itemsNew ?? 0,
                durationMs: Date.now() - startedAt,
                logs: [
                    ...runningJob.logs,
                    success ? 'Data synced successfully.' : 'Sync failed.',
                    data?.error ? String(data.error) : 'Completed'
                ]
            };

            setSyncJobs(prev => prev.map(j => j.id === jobId ? completedJob : j));
            setCredentials(prev => prev.map(c => c.id === credentialId ? {
                ...c,
                status: success ? 'active' : 'error',
                lastSync: new Date().toISOString(),
                failureCount: success ? 0 : (c.failureCount ?? 0) + 1
            } : c));
        } catch (error) {
            console.error('Trigger sync failed', error);
            const failedJob: SyncJob = {
                ...runningJob,
                status: 'failed',
                durationMs: 0,
                logs: [...runningJob.logs, 'Sync failed with error.']
            };
            setSyncJobs(prev => prev.map(j => j.id === jobId ? failedJob : j));
        }
    };

    // Stats Data Setters (for local updates before save)
    const updateMovieData = (data: MovieData[]) => setMovieData(data);
    const updateGameData = (data: GameGenreData[]) => setGameData(data);
    const updateSkillData = (data: SkillData[]) => setSkillData(data);
    const updatePhotoStats = (data: PhotoStatsData[]) => setPhotoStats(data);
    const updateRoutineData = (data: RoutineData[]) => setRoutineData(data);
    const updateStepsData = (data: StepData[]) => setStepsData(data);

    // Social Operations
    const toggleLike = (id: string, type: 'article' | 'moment' | 'share') => {
        if (type === 'article') {
            setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
        } else if (type === 'moment') {
            setMoments(moments.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m));
        } else if (type === 'share') {
            setShareItems(shareItems.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s));
        }
    };

    const addComment = (id: string, type: 'article' | 'moment', text: string, username: string) => {
        const newComment = {
            id: Math.random().toString(36).substr(2, 9),
            username,
            content: text,
            date: new Date().toLocaleDateString()
        };

        if (type === 'article') {
            setPosts(posts.map(p => p.id === id ? { ...p, comments: [...p.comments, newComment] } : p));
        } else {
            setMoments(moments.map(m => m.id === id ? { ...m, comments: [...m.comments, newComment] } : m));
        }
    };

    const convertCurrency = (amount: number, from: string) => {
        const rates: { [key: string]: number } = {
            'CNY': 1,
            'USD': 7.2,
            'JPY': 0.05,
            'HKD': 0.92
        };
        const rate = rates[from] || 1;
        return amount * rate;
    }

    return (
        <DataContext.Provider value={{
            // Loading and Error States
            loading, errors,

            posts, moments, shareItems, projects, galleryItems,
            movieData, gameData, skillData, photoStats, routineData, stepsData, heroImages,
            trafficData, sourceData, pageVisitData, deviceData,
            friends, subscriptions, credentials, syncJobs,

            addPost, updatePost, deletePost,
            addMoment, updateMoment, deleteMoment,
            addProject, updateProject, deleteProject,
            addShareItem, updateShareItem, deleteShareItem,
            addGalleryItem, updateGalleryItem, deleteGalleryItem,

            // Hero Images
            addHeroImage, updateHeroImage, deleteHeroImage,

            // Friends
            addFriend, updateFriend, deleteFriend, resetFriendPassword,

            addSubscription, updateSubscription, deleteSubscription,
            addCredential, updateCredential, deleteCredential, triggerSync,

            updateMovieData, updateGameData, updateSkillData,
            updatePhotoStats, updateRoutineData, updateStepsData,
            saveLifeData,

            toggleLike, addComment,

            // Refresh functions
            refreshPosts, refreshMoments, refreshProjects, refreshShareItems,
            refreshGallery, refreshHeroImages, refreshFriends, refreshAnalytics, refreshLifeData,

            convertCurrency
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
