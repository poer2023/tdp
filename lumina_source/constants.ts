

import { BlogPost, Moment, Category, MovieData, GameGenreData, SkillData, GalleryItem, PhotoStatsData, RoutineData, StepData, Project, ShareItem, TrafficData, SourceData, PageVisitData, DeviceData, Friend, Subscription, Credential, SyncJob } from './types';

// Simplified Navigation with Paths
export const NAV_LINKS = [
  { label: 'Home', value: Category.HOME, path: '/' },
  { label: 'Projects', value: Category.PROJECTS, path: '/projects' }, // New Link
  { label: 'Gallery', value: Category.GALLERY, path: '/gallery' },
  { label: 'Life Log', value: Category.DATA, path: '/data' },
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Lumina Blog System',
    description: 'A minimalist personal blog platform built with React and Tailwind CSS. Features dark mode, masonry layout, and interactive data visualization for quantified self tracking.',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80',
    technologies: ['React', 'TypeScript', 'Tailwind', 'Recharts'],
    demoUrl: '#',
    repoUrl: '#',
    date: '2023',
    featured: true,
    role: 'Design & Dev',
    year: '2023',
    features: [
        'Responsive Masonry Grid Layout',
        'Custom Interactive Data Charts',
        'Dark/Light Mode with Persistance',
        'Optimized Animations'
    ],
    stats: [
        { label: 'Performance', value: '99' },
        { label: 'Components', value: '45+' }
    ]
  },
  {
    id: 'p2',
    title: 'Focus Flow',
    description: 'A productivity application combining a customizable Pomodoro timer with curated ambient lo-fi music streaming to help deep work sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?ixlib=rb-4.0.3&auto=format&fit=crop&w=1548&q=80',
    technologies: ['Vue', 'Spotify API', 'Firebase', 'Pinia'],
    demoUrl: '#',
    date: '2022',
    role: 'Frontend Lead',
    year: '2022',
    features: [
        'Spotify Premium Integration',
        'Customizable Timer Intervals',
        'Task Management Board',
        'Weekly Productivity Reports'
    ],
    stats: [
        { label: 'Users', value: '2.5k' },
        { label: 'Sessions', value: '12k' }
    ]
  },
  {
    id: 'p3',
    title: 'Lens Metrics',
    description: 'Analytics dashboard for photographers to track EXIF data trends across their catalogue. Helps understand lens usage and shooting habits.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    technologies: ['Python', 'Pandas', 'D3.js', 'Flask'],
    repoUrl: '#',
    date: '2023',
    role: 'Data Engineer',
    year: '2023',
    features: [
        'Batch EXIF Extraction',
        'Interactive Focal Length Heatmaps',
        'ISO & Shutter Speed Analysis',
        'Export Reports to PDF'
    ],
    stats: [
        { label: 'Processed', value: '50k+' },
        { label: 'Accuracy', value: '100%' }
    ]
  }
];

export const SHARE_ITEMS: ShareItem[] = [
    {
        id: 's1',
        title: 'Linear - The issue tracker I dream of',
        description: 'The attention to detail in Linear’s UI/UX is simply unmatched. It makes project management feel like playing a video game.',
        url: 'https://linear.app',
        domain: 'linear.app',
        imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80',
        date: '2 hours ago',
        tags: ['Design', 'Tools'],
        type: 'share',
        likes: 12
    },
    {
        id: 's2',
        title: 'Josh Comeau\'s CSS Blog',
        description: 'Whenever I struggle with CSS, I check if Josh has written about it. The interactive examples are gold.',
        url: 'https://joshwcomeau.com',
        domain: 'joshwcomeau.com',
        date: 'Nov 14, 2023',
        tags: ['Dev', 'Learning'],
        type: 'share',
        likes: 45
    },
    {
        id: 's3',
        title: 'Analogue Pocket',
        description: 'Finally got my hands on this. The screen is absolutely gorgeous for retro gaming.',
        url: 'https://analogue.co',
        domain: 'analogue.co',
        imageUrl: 'https://images.unsplash.com/photo-1555864326-5cf22ef123cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
        date: 'Nov 10, 2023',
        tags: ['Gadget', 'Gaming'],
        type: 'share',
        likes: 89
    }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Sunday Morning Rituals',
    excerpt: 'Why I started waking up at 6 AM to brew pour-over coffee and just sit in silence before the digital noise begins.',
    category: 'Life',
    date: 'Oct 12, 2023',
    readTime: '4 min read',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    tags: ['Mindfulness', 'Coffee'],
    type: 'article',
    likes: 24,
    comments: [
      { id: 'c1', username: 'alex_dev', content: 'This resonates so much. The morning silence is golden.', date: 'Oct 12, 2023' }
    ]
  },
  {
    id: '2',
    title: 'Empathy Mapping in Product Discovery',
    excerpt: 'Moving beyond user personas. How to truly feel what your user feels when they encounter a friction point in your app.',
    category: 'Product Mgmt',
    date: 'Oct 15, 2023',
    readTime: '8 min read',
    tags: ['UX', 'Product Strategy'],
    type: 'article',
    likes: 45,
    comments: []
  },
  {
    id: '3',
    title: 'Exploring Gemini 2.5 Flash',
    excerpt: 'A deep dive into the new multimodal capabilities and how it improves latency for real-time applications.',
    category: 'Tech',
    date: 'Oct 20, 2023',
    readTime: '6 min read',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    tags: ['AI', 'LLM', 'Dev'],
    type: 'article',
    likes: 102,
    comments: [
        { id: 'c2', username: 'tech_enthusiast', content: 'The latency improvements are game changing!', date: 'Oct 21, 2023' }
    ]
  },
  {
    id: '5',
    title: 'The Art of Saying "No" to Features',
    excerpt: 'As a PM, your backlog is infinite. Learning to prioritize ruthlessly while maintaining team morale is a key skill.',
    category: 'Product Mgmt',
    date: 'Oct 28, 2023',
    readTime: '5 min read',
    tags: ['Prioritization', 'Leadership'],
    type: 'article',
    likes: 89,
    comments: []
  },
  {
    id: '6',
    title: 'Migrating to TypeScript: A Retrospective',
    excerpt: 'It was painful at first, but the type safety has saved us countless hours of debugging in production.',
    category: 'Tech',
    date: 'Nov 01, 2023',
    readTime: '7 min read',
    tags: ['TypeScript', 'Refactoring'],
    type: 'article',
    likes: 56,
    comments: []
  },
    {
    id: '8',
    title: 'Switching to Linux for Daily Driving',
    excerpt: 'My experience moving from macOS to Arch Linux. The customization is endless, but so is the configuration.',
    category: 'Tech',
    date: 'Nov 10, 2023',
    readTime: '10 min read',
    tags: ['Linux', 'OS'],
    type: 'article',
    likes: 12,
    comments: []
  }
];

export const MOMENTS: Moment[] = [
    {
        id: 'm1',
        content: 'Just finished "Oppenheimer". The sound design is absolutely terrifying and brilliant. Nolan does it again. 🎬',
        date: '2 hours ago',
        tags: ['Movie', 'Thoughts'],
        type: 'moment',
        likes: 15,
        comments: []
    },
    {
        id: 'm2',
        content: 'Golden hour hit differently today. Walking through the old town district.',
        images: [
            'https://picsum.photos/600/600?random=10',
            'https://picsum.photos/600/600?random=11',
            'https://picsum.photos/600/600?random=12'
        ],
        date: 'Yesterday',
        tags: ['Photography', 'City'],
        type: 'moment',
        likes: 34,
        comments: [
             { id: 'm_c1', username: 'sarah_p', content: 'Great shots! What camera do you use?', date: 'Yesterday' }
        ]
    },
    {
        id: 'm3',
        content: 'New mechanical keyboard arrived! The thock sound is incredibly satisfying. Keychron Q1 Pro.',
        images: ['https://picsum.photos/800/400?random=13'],
        date: 'Nov 12, 2023',
        tags: ['Gadgets', 'Setup'],
        type: 'moment',
        likes: 22,
        comments: []
    },
    {
        id: 'm4',
        content: 'Trying to center a div in 2023 is still harder than it should be. #css #webdev',
        date: 'Nov 08, 2023',
        tags: ['DevRant'],
        type: 'moment',
        likes: 41,
        comments: []
    }
]

// --- Gallery Data ---
export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80',
    title: 'Alpine Lake',
    description: 'The serenity of the mountains in early morning.',
    date: '2023-09-15',
    location: 'Swiss Alps',
    exif: { camera: 'Sony A7IV', lens: '24-70mm GM', aperture: 'f/8', iso: '100', shutter: '1/200s' }
  },
  {
    id: 'g2',
    type: 'video',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    title: 'Blooming Season',
    description: 'A timelapse of spring arriving in the garden.',
    date: '2023-04-20',
    location: 'Kyoto, Japan'
  },
  {
    id: 'g3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517816168141-54872e251675?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80',
    title: 'Urban Solitude',
    date: '2023-11-02',
    location: 'Tokyo',
    exif: { camera: 'Fujifilm X-T5', lens: '35mm f/1.4', aperture: 'f/2.0', iso: '800', shutter: '1/60s' }
  },
  {
    id: 'g4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?ixlib=rb-4.0.3&auto=format&fit=crop&w=1675&q=80',
    title: 'Desert Dunes',
    description: 'Shadows playing on the sand.',
    date: '2023-08-10',
    exif: { camera: 'Canon R5', lens: '70-200mm', aperture: 'f/11', iso: '200', shutter: '1/500s' }
  },
  {
    id: 'g5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    title: 'Retro Tech',
    date: '2023-10-12',
    exif: { camera: 'Leica Q2', lens: '28mm', aperture: 'f/1.7', iso: '400', shutter: '1/125s' }
  },
   {
    id: 'g6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531297461136-82af022f0b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80',
    title: 'Starry Night',
    description: 'Long exposure shot away from city lights.',
    date: '2023-07-04',
    location: 'Joshua Tree',
    exif: { camera: 'Sony A7IV', lens: '14mm GM', aperture: 'f/1.8', iso: '3200', shutter: '20s' }
  }
];


// --- Life Log Mock Data ---

export const PHOTO_STATS_DATA: PhotoStatsData[] = [
  { day: 'Mon', count: 12 },
  { day: 'Tue', count: 5 },
  { day: 'Wed', count: 48 }, // A spike
  { day: 'Thu', count: 8 },
  { day: 'Fri', count: 124 }, // Big shoot
  { day: 'Sat', count: 230 }, // Weekend trip
  { day: 'Sun', count: 45 },
];

export const ROUTINE_DATA: RoutineData[] = [
  { name: 'Coding', value: 8, color: '#457a53' }, // sage-600
  { name: 'Sleep', value: 7, color: '#292524' },  // stone-800
  { name: 'Read', value: 2, color: '#e11d48' },  // rose-600
  { name: 'Exercise', value: 1.5, color: '#d97706' }, // amber-600
  { name: 'Life', value: 5.5, color: '#a8a29e' }, // stone-400
];

export const STEPS_DATA: StepData[] = [
    { day: 'Mon', steps: 6500 },
    { day: 'Tue', steps: 8200 },
    { day: 'Wed', steps: 5800 },
    { day: 'Thu', steps: 11000 },
    { day: 'Fri', steps: 9500 },
    { day: 'Sat', steps: 15000 },
    { day: 'Sun', steps: 4000 },
];

export const MOVIE_DATA: MovieData[] = [
  { month: 'Jan', movies: 4, series: 1 },
  { month: 'Feb', movies: 3, series: 2 },
  { month: 'Mar', movies: 6, series: 0 },
  { month: 'Apr', movies: 2, series: 3 },
  { month: 'May', movies: 5, series: 1 },
  { month: 'Jun', movies: 4, series: 2 },
];

export const GAME_GENRE_DATA: GameGenreData[] = [
  { subject: 'RPG', A: 120, fullMark: 150 },
  { subject: 'FPS', A: 40, fullMark: 150 },
  { subject: 'Strategy', A: 90, fullMark: 150 },
  { subject: 'Indie', A: 80, fullMark: 150 },
  { subject: 'Puzzle', A: 50, fullMark: 150 },
  { subject: 'Sim', A: 65, fullMark: 150 },
];

export const SKILLS_DATA: SkillData[] = [
    { name: 'Product Vision', level: 85 },
    { name: 'React/Frontend', level: 70 },
    { name: 'Photography', level: 60 },
    { name: 'Data Analysis', level: 75 },
];

export const PHOTO_WALL_IMAGES = [
    'https://picsum.photos/400/400?random=101',
    'https://picsum.photos/400/400?random=102',
    'https://picsum.photos/400/400?random=103',
    'https://picsum.photos/400/400?random=104',
    'https://picsum.photos/400/400?random=105',
    'https://picsum.photos/400/400?random=106',
    'https://picsum.photos/400/400?random=107',
    'https://picsum.photos/400/400?random=108',
    'https://picsum.photos/400/400?random=109',
    'https://picsum.photos/400/400?random=110',
    'https://picsum.photos/400/400?random=111',
    'https://picsum.photos/400/400?random=112',
];

// --- Traffic Data Mocks ---
export const TRAFFIC_DATA: TrafficData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const base = isWeekend ? 300 : 500;
    const random = Math.floor(Math.random() * 200);
    const visits = base + random;
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visits: visits,
        unique: Math.floor(visits * 0.75),
    };
});

export const SOURCE_DATA: SourceData[] = [
    { name: 'Search', value: 45, color: '#57534e' }, // Stone 600
    { name: 'Direct', value: 25, color: '#78716c' }, // Stone 500
    { name: 'Social', value: 20, color: '#a8a29e' }, // Stone 400
    { name: 'Referral', value: 10, color: '#d6d3d1' }, // Stone 300
];

export const PAGE_VISIT_DATA: PageVisitData[] = [
    { path: '/blog/exploring-gemini-2-5', title: 'Exploring Gemini 2.5 Flash', visits: 1245 },
    { path: '/gallery', title: 'Gallery', visits: 856 },
    { path: '/projects/lumina', title: 'Project: Lumina Blog', visits: 645 },
    { path: '/', title: 'Home', visits: 3421 },
    { path: '/about', title: 'About Me', visits: 220 },
    { path: '/blog/sunday-morning', title: 'Sunday Morning Rituals', visits: 189 },
].sort((a,b) => b.visits - a.visits);

export const DEVICE_DATA: DeviceData[] = [
    { name: 'Desktop', value: 58, color: '#44403c' },
    { name: 'Mobile', value: 35, color: '#a8a29e' },
    { name: 'Tablet', value: 7, color: '#e7e5e4' },
];

// --- FRIENDS MOCK DATA ---
export const FRIENDS_DATA: Friend[] = [
    { id: 'f1', name: 'Alice Guo', accessCode: 'a8s7d6', note: 'Colleague from Tencent', tags: ['Work', 'Close'], status: 'active', createdAt: '2023-01-12', validUntil: '2025-01-01' },
    { id: 'f2', name: 'Bob Chen', accessCode: '123xyz', note: 'University Classmate', tags: ['School', 'Close'], status: 'active', createdAt: '2023-03-05' },
    { id: 'f3', name: 'Charlie', accessCode: 'hidden', note: 'Met at conference', tags: ['Network'], status: 'banned', createdAt: '2023-06-20' },
];

// --- SUBSCRIPTIONS MOCK DATA ---
export const SUBSCRIPTIONS_DATA: Subscription[] = [
    { id: 'sub1', name: 'ChatGPT Plus', price: 20, currency: 'USD', cycle: 'monthly', category: 'AI Tools', active: true, nextBilling: '2023-11-25' },
    { id: 'sub2', name: 'Netflix', price: 1800, currency: 'JPY', cycle: 'monthly', category: 'Entertainment', active: true, nextBilling: '2023-11-15' },
    { id: 'sub3', name: 'Vercel Pro', price: 20, currency: 'USD', cycle: 'monthly', category: 'Hosting', active: true, nextBilling: '2023-11-01' },
    { id: 'sub4', name: 'Midjourney', price: 10, currency: 'USD', cycle: 'monthly', category: 'AI Tools', active: false, description: 'Paused for now' },
    { id: 'sub5', name: 'Adobe Creative Cloud', price: 280, currency: 'HKD', cycle: 'monthly', category: 'Software', active: true },
    { id: 'sub6', name: 'Domain Renewal', price: 12, currency: 'USD', cycle: 'yearly', category: 'Hosting', active: true, nextBilling: '2024-05-12' },
];

// --- CREDENTIALS MOCK DATA ---
export const CREDENTIALS_DATA: Credential[] = [
    { id: 'cr1', platform: 'Bilibili', name: 'Main Account', identifier: 'sessdata_******', type: 'cookie', status: 'active', lastSync: '10 mins ago', failureCount: 0 },
    { id: 'cr2', platform: 'Douban', name: 'Movie Tracker', identifier: 'dbcl2_******', type: 'cookie', status: 'expired', lastSync: '2 days ago', failureCount: 3 },
    { id: 'cr3', platform: 'Steam', name: 'Gaming', identifier: 'steam_api_key_******', type: 'api_key', status: 'active', lastSync: '1 hour ago', failureCount: 0 },
    { id: 'cr4', platform: 'GitHub', name: 'Personal Access Token', identifier: 'ghp_******', type: 'token', status: 'active', lastSync: '5 mins ago', failureCount: 0 },
];
