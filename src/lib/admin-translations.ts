/**
 * Admin Translations
 * Translation dictionaries for admin interface (Client-safe)
 */

export type AdminLocale = "en" | "zh";

/**
 * Admin UI translations
 */
export const adminTranslations = {
  en: {
    // Layout
    admin: "Admin",
    contentManagement: "Content Management",
    backToSite: "Back to site",

    // Navigation sections
    content: "Content",
    operations: "Operations",

    // Navigation items
    overview: "Overview",
    dashboard: "Dashboard",
    posts: "Posts",
    managePosts: "Manage articles",
    gallery: "Gallery",
    photoManagement: "Photo management",
    contentIO: "Content I/O",
    importExport: "Import & Export",

    // Dashboard
    contentDashboard: "Content management dashboard",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",

    // Posts metrics
    postsLabel: "Posts",
    published: "Published",
    drafts: "Drafts",

    // Gallery metrics
    galleryLabel: "Gallery",
    live: "Live",
    geotagged: "Geotagged",

    // Action cards
    createManageArticles: "Create and manage articles",
    uploadOrganizePhotos: "Upload and organize photos",
    importExportContent: "Import and export content",
    newPost: "New Post",
    upload: "Upload",
    export: "Export",

    // Footer
    loggedInAs: "Logged in as",

    // Error pages
    forbidden: "Forbidden - Admin access required",
    returnToHome: "Return to Home",

    // Post Analytics
    topPosts: "Top Posts",
    views: "views",
    view: "View",
    totalPostsShort: "Total",
    totalViewsShort: "Views",
    avgViewsShort: "Avg",
    noPostsYet: "No posts yet",
    failedToLoadStats: "Failed to load stats",
  },
  zh: {
    // Layout
    admin: "管理后台",
    contentManagement: "内容管理",
    backToSite: "返回网站",

    // Navigation sections
    content: "内容",
    operations: "操作",

    // Navigation items
    overview: "概览",
    dashboard: "仪表板",
    posts: "文章",
    managePosts: "管理文章",
    gallery: "相册",
    photoManagement: "照片管理",
    contentIO: "内容导入导出",
    importExport: "导入和导出",

    // Dashboard
    contentDashboard: "内容管理仪表板",
    quickActions: "快捷操作",
    recentActivity: "最近活动",

    // Posts metrics
    postsLabel: "文章",
    published: "已发布",
    drafts: "草稿",

    // Gallery metrics
    galleryLabel: "相册",
    live: "Live 照片",
    geotagged: "带位置",

    // Action cards
    createManageArticles: "创建和管理文章",
    uploadOrganizePhotos: "上传和管理照片",
    importExportContent: "导入和导出内容",
    newPost: "新建文章",
    upload: "上传",
    export: "导出",

    // Footer
    loggedInAs: "当前登录",

    // Error pages
    forbidden: "禁止访问 - 需要管理员权限",
    returnToHome: "返回首页",

    // Post Analytics
    topPosts: "热门文章",
    views: "次浏览",
    view: "查看",
    totalPostsShort: "总数",
    totalViewsShort: "浏览",
    avgViewsShort: "平均",
    noPostsYet: "暂无文章",
    failedToLoadStats: "加载统计失败",
  },
} as const;

/**
 * Get translated text (Client-safe)
 */
export function t(locale: AdminLocale, key: keyof typeof adminTranslations.en): string {
  return adminTranslations[locale][key];
}
