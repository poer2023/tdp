

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BlogPost, Moment, MovieData, GameGenreData, SkillData, User, Theme, Language, GalleryItem, PhotoStatsData, RoutineData, StepData, Project, ShareItem, TrafficData, SourceData, PageVisitData, DeviceData, Friend, Subscription, Credential, SyncJob } from './types';
import { BLOG_POSTS, MOMENTS, MOVIE_DATA, GAME_GENRE_DATA, SKILLS_DATA, PHOTO_WALL_IMAGES, GALLERY_ITEMS, PHOTO_STATS_DATA, ROUTINE_DATA, STEPS_DATA, PROJECTS, SHARE_ITEMS, TRAFFIC_DATA, SOURCE_DATA, PAGE_VISIT_DATA, DEVICE_DATA, FRIENDS_DATA, SUBSCRIPTIONS_DATA, CREDENTIALS_DATA } from './constants';

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

// --- Settings Context ---
interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

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

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  friendCode: string | null; // Track visitor identity
  login: (username: string, pass: string) => boolean;
  register: (username: string, pass: string) => boolean;
  loginAsFriend: (code: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user from localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('Zhi_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Initialize Friend Code from localStorage
  const [friendCode, setFriendCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem('Zhi_friend_code');
    } catch (e) {
      return null;
    }
  });

  // Mock User Database
  const [users, setUsers] = useState<Map<string, string>>(new Map([
    ['admin', 'Zhi123'],
    ['visitor', 'visitor123']
  ]));

  const login = (u: string, p: string) => {
    if (users.has(u) && users.get(u) === p) {
      const newUser: User = {
        username: u,
        role: u === 'admin' ? 'admin' : 'user'
      };
      setUser(newUser);
      // Persist to localStorage
      localStorage.setItem('Zhi_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const register = (u: string, p: string) => {
    if (users.has(u)) return false;
    const newUsers = new Map(users);
    newUsers.set(u, p);
    setUsers(newUsers);

    const newUser: User = { username: u, role: 'user' };
    setUser(newUser);
    localStorage.setItem('Zhi_user', JSON.stringify(newUser));
    return true;
  }

  const loginAsFriend = (code: string) => {
    setFriendCode(code);
    localStorage.setItem('Zhi_friend_code', code);
  };

  const logout = () => {
    setUser(null);
    // We purposefully don't clear friendCode on regular logout, 
    // but if we wanted a "Full Reset" we could.
    // For now, let's keep friend identity persistent even if admin logs out.
    // Uncomment below to clear friend identity on logout:
    // setFriendCode(null);
    // localStorage.removeItem('Zhi_friend_code');
    localStorage.removeItem('Zhi_user');
  };

  return (
    <AuthContext.Provider value={{ user, friendCode, login, register, loginAsFriend, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Data Context ---
interface DataContextType {
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
  heroImages: string[];

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
  addPost: (post: BlogPost) => void;
  updatePost: (post: BlogPost) => void;
  deletePost: (id: string) => void;

  addMoment: (moment: Moment) => void;
  updateMoment: (moment: Moment) => void;
  deleteMoment: (id: string) => void;

  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  addShareItem: (item: ShareItem) => void;
  updateShareItem: (item: ShareItem) => void;
  deleteShareItem: (id: string) => void;

  addGalleryItem: (item: GalleryItem) => void;
  updateGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;

  // New Actions
  addFriend: (f: Friend) => void;
  updateFriend: (f: Friend) => void;
  deleteFriend: (id: string) => void;

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
  updateHeroImages: (images: string[]) => void;

  // Social Actions
  toggleLike: (id: string, type: 'article' | 'moment' | 'share') => void;
  addComment: (id: string, type: 'article' | 'moment', text: string, username: string) => void;

  // Utils
  convertCurrency: (amount: number, from: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [moments, setMoments] = useState<Moment[]>(MOMENTS);
  const [shareItems, setShareItems] = useState<ShareItem[]>(SHARE_ITEMS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [movieData, setMovieData] = useState<MovieData[]>(MOVIE_DATA);
  const [gameData, setGameData] = useState<GameGenreData[]>(GAME_GENRE_DATA);
  const [skillData, setSkillData] = useState<SkillData[]>(SKILLS_DATA);
  const [photoStats, setPhotoStats] = useState<PhotoStatsData[]>(PHOTO_STATS_DATA);
  const [routineData, setRoutineData] = useState<RoutineData[]>(ROUTINE_DATA);
  const [stepsData, setStepsData] = useState<StepData[]>(STEPS_DATA);
  const [heroImages, setHeroImages] = useState<string[]>(PHOTO_WALL_IMAGES);

  // Traffic Stats Mock State
  const [trafficData, setTrafficData] = useState<TrafficData[]>(TRAFFIC_DATA);
  const [sourceData, setSourceData] = useState<SourceData[]>(SOURCE_DATA);
  const [pageVisitData, setPageVisitData] = useState<PageVisitData[]>(PAGE_VISIT_DATA);
  const [deviceData, setDeviceData] = useState<DeviceData[]>(DEVICE_DATA);

  // NEW MODULES STATE
  const [friends, setFriends] = useState<Friend[]>(FRIENDS_DATA);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(SUBSCRIPTIONS_DATA);
  const [credentials, setCredentials] = useState<Credential[]>(CREDENTIALS_DATA);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);


  // --- CRUD Operations ---

  // Posts
  const addPost = (post: BlogPost) => setPosts([post, ...posts]);
  const updatePost = (updated: BlogPost) => setPosts(posts.map(p => p.id === updated.id ? updated : p));
  const deletePost = (id: string) => setPosts(posts.filter(p => p.id !== id));

  // Moments
  const addMoment = (moment: Moment) => setMoments([moment, ...moments]);
  const updateMoment = (updated: Moment) => setMoments(moments.map(m => m.id === updated.id ? updated : m));
  const deleteMoment = (id: string) => setMoments(moments.filter(m => m.id !== id));

  // Projects
  const addProject = (project: Project) => setProjects([project, ...projects]);
  const updateProject = (updated: Project) => setProjects(projects.map(p => p.id === updated.id ? updated : p));
  const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

  // Share Items (Curated)
  const addShareItem = (item: ShareItem) => setShareItems([item, ...shareItems]);
  const updateShareItem = (updated: ShareItem) => setShareItems(shareItems.map(s => s.id === updated.id ? updated : s));
  const deleteShareItem = (id: string) => setShareItems(shareItems.filter(s => s.id !== id));

  // Gallery
  const addGalleryItem = (item: GalleryItem) => setGalleryItems([item, ...galleryItems]);
  const updateGalleryItem = (updated: GalleryItem) => setGalleryItems(galleryItems.map(g => g.id === updated.id ? updated : g));
  const deleteGalleryItem = (id: string) => setGalleryItems(galleryItems.filter(g => g.id !== id));

  // --- NEW MODULES CRUD ---
  const addFriend = (f: Friend) => setFriends([f, ...friends]);
  const updateFriend = (f: Friend) => setFriends(friends.map(existing => existing.id === f.id ? f : existing));
  const deleteFriend = (id: string) => setFriends(friends.filter(f => f.id !== id));

  const addSubscription = (s: Subscription) => setSubscriptions([s, ...subscriptions]);
  const updateSubscription = (s: Subscription) => setSubscriptions(subscriptions.map(existing => existing.id === s.id ? s : existing));
  const deleteSubscription = (id: string) => setSubscriptions(subscriptions.filter(s => s.id !== id));

  const addCredential = (c: Credential) => setCredentials([c, ...credentials]);
  const updateCredential = (c: Credential) => setCredentials(credentials.map(existing => existing.id === c.id ? c : existing));
  const deleteCredential = (id: string) => setCredentials(credentials.filter(c => c.id !== id));

  const triggerSync = async (credentialId: string) => {
    // 1. Find credential
    const cred = credentials.find(c => c.id === credentialId);
    if (!cred) return;

    // 2. Create running job
    const jobId = Math.random().toString(36).substr(2, 9);
    const newJob: SyncJob = {
      id: jobId,
      credentialId: cred.id,
      platform: cred.platform,
      status: 'running',
      itemsProcessed: 0,
      durationMs: 0,
      timestamp: new Date().toISOString(),
      logs: ['Starting sync job...', `Connecting to ${cred.platform}...`]
    };
    setSyncJobs(prev => [newJob, ...prev]);

    // 3. Simulate delay and result
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const success = Math.random() > 0.2; // 80% success chance

    // 4. Update job and credential
    const completedJob: SyncJob = {
      ...newJob,
      status: success ? 'success' : 'failed',
      itemsProcessed: success ? Math.floor(Math.random() * 50) : 0,
      durationMs: delay,
      logs: [
        ...newJob.logs,
        success ? 'Data fetched successfully.' : 'Connection timeout.',
        success ? `Processed ${Math.floor(Math.random() * 50)} items.` : 'Retrying failed.',
        `Job finished with status: ${success ? 'SUCCESS' : 'FAILED'}`
      ]
    };
    setSyncJobs(prev => prev.map(j => j.id === jobId ? completedJob : j));

    updateCredential({
      ...cred,
      lastSync: 'Just now',
      status: success ? 'active' : 'error',
      failureCount: success ? 0 : cred.failureCount + 1
    });
  };

  // Stats Data Setters
  const updateMovieData = (data: MovieData[]) => setMovieData(data);
  const updateGameData = (data: GameGenreData[]) => setGameData(data);
  const updateSkillData = (data: SkillData[]) => setSkillData(data);
  const updatePhotoStats = (data: PhotoStatsData[]) => setPhotoStats(data);
  const updateRoutineData = (data: RoutineData[]) => setRoutineData(data);
  const updateStepsData = (data: StepData[]) => setStepsData(data);
  const updateHeroImages = (images: string[]) => setHeroImages(images);

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
      posts, moments, shareItems, projects, galleryItems,
      movieData, gameData, skillData, photoStats, routineData, stepsData, heroImages,
      trafficData, sourceData, pageVisitData, deviceData,
      friends, subscriptions, credentials, syncJobs,

      addPost, updatePost, deletePost,
      addMoment, updateMoment, deleteMoment,
      addProject, updateProject, deleteProject,
      addShareItem, updateShareItem, deleteShareItem,
      addGalleryItem, updateGalleryItem, deleteGalleryItem,

      addFriend, updateFriend, deleteFriend,
      addSubscription, updateSubscription, deleteSubscription,
      addCredential, updateCredential, deleteCredential, triggerSync,

      updateMovieData, updateGameData, updateSkillData,
      updatePhotoStats, updateRoutineData, updateStepsData, updateHeroImages,

      toggleLike, addComment, convertCurrency
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
