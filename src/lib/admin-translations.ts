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
    subscriptions: "Subscriptions",
    subscriptionManagement: "Subscription management",
    subscriptionDescription: "Track recurring subscriptions and costs",
    createNewSubscription: "Create and manage your subscriptions",
    credentials: "Credentials",
    credentialManagement: "Credential management",
    credentialDescription: "Manage API keys, cookies, and authentication tokens",

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

    // Analytics
    analytics: "Analytics",
    analyticsDescription: "Traffic insights",
    viewAnalytics: "View Analytics",
    trafficInsights: "Website traffic and visitor statistics",
    todayVisits: "Today's Visits",
    weeklyVisits: "Weekly Visits",
    totalVisitors: "Total Visitors",
    avgVisits: "Average Visits",
    dailyAverage: "Daily average",
    trendChart: "7-Day Trend",
    topPages: "Top Pages",
    languageDistribution: "Language Distribution",
    noDataYet: "No data yet",
    uniqueVisitors: "unique visitors",
    visits: "visits",
    registeredUsers: "Registered Users",

    // Page types
    postsType: "Posts",
    galleryType: "Gallery",
    momentsType: "Moments",
    otherType: "Other",
    viewAll: "View All",
    showLess: "Show Less",
    vsLastWeek: "vs. Last Week",
    percentage: "Percentage",
    title: "Title",
    subscriptionOverview: "Subscription Overview",
    subscriptionList: "Subscription Items",
    addSubscription: "Add Subscription",
    editSubscription: "Edit Subscription",
    deleteSubscription: "Delete Subscription",
    monthlyView: "Monthly View",
    annualView: "Annual View",
    markdownExport: "Export as Markdown",
    subscriptionName: "Subscription name",
    originalAmount: "Original amount",
    convertedAmount: "Converted amount",
    billingCycle: "Billing cycle",
    startDate: "Start date",
    endDate: "End date",
    currency: "Currency",
    notes: "Notes",
    monthlyTotal: "Monthly total",
    annualTotal: "Annual total",
    chartSubscriptions: "Subscriptions chart",
    chartTrend: "Spending trend",
    noSubscriptions: "No subscriptions yet",
    createFirstSubscription: "Create your first subscription to get started.",
    saveChanges: "Save changes",
    cancel: "Cancel",
    confirmDelete: "Delete this subscription?",
    confirmDeleteDescription: "This action will permanently remove the subscription record.",
    newSubscription: "New Subscription",
    updateSubscription: "Update Subscription",
    exportReady: "Subscription data exported to Markdown.",
    copyMarkdown: "Copy Markdown",
    downloadMarkdown: "Download Markdown",
    monthlySpend: "Monthly spend",
    annualSpend: "Annual spend",
    markdownExportDescription: "Download a Markdown snapshot of your current subscriptions.",
    filterByCycle: "Filter by billing cycle",
    noEndDate: "No end date",
    progress: "Progress",
    trendDescription: "Month-over-month spending trend",
    currentMonth: "Current month",

    // Credentials
    credentialList: "Credential List",
    addCredential: "Add Credential",
    editCredential: "Edit Credential",
    deleteCredential: "Delete Credential",
    validateCredential: "Validate",
    credentialName: "Credential Name",
    credentialType: "Type",
    credentialValue: "Value",
    credentialPlatform: "Platform",
    credentialStatus: "Status",
    credentialMetadata: "Metadata",
    credentialCreatedAt: "Created",
    credentialUpdatedAt: "Updated",
    lastValidated: "Last Validated",
    validUntil: "Valid Until",
    lastUsed: "Last Used",
    usageCount: "Usage Count",
    failureCount: "Failure Count",
    lastError: "Last Error",
    isValid: "Valid",
    isInvalid: "Invalid",
    validationSuccess: "Validation successful",
    validationFailed: "Validation failed",

    // Credential Types
    apiKey: "API Key",
    cookie: "Cookie",
    oauthToken: "OAuth Token",

    // Platforms
    steam: "Steam",
    hoyoverse: "HoYoverse",
    bilibili: "Bilibili",
    douban: "Douban",
    jellyfin: "Jellyfin",

    // Credential Form
    enterCredentialName: "Enter credential name",
    enterCredentialValue: "Enter credential value",
    selectCredentialType: "Select credential type",
    selectPlatform: "Select platform",
    optionalMetadata: "Optional metadata (JSON)",
    credentialValuePlaceholder: "Paste your credential value here",

    // Credential Actions
    noCredentials: "No credentials yet",
    createFirstCredential: "Create your first credential to get started.",
    confirmDeleteCredential: "Delete this credential?",
    confirmDeleteCredentialDescription:
      "This action will permanently remove the credential and cannot be undone.",
    credentialSaved: "Credential saved successfully",
    credentialDeleted: "Credential deleted successfully",
    credentialValidated: "Credential validated",

    // Sync Jobs
    syncJobs: "Sync Jobs",
    syncJobId: "Job ID",
    syncJobPlatform: "Platform",
    syncJobStatus: "Status",
    syncJobStartedAt: "Started",
    syncJobCompletedAt: "Completed",
    syncJobDuration: "Duration",
    syncJobItemsTotal: "Total Items",
    syncJobItemsSuccess: "Success",
    syncJobItemsFailed: "Failed",
    syncJobMessage: "Message",
    syncJobError: "Error",
    triggeredBy: "Triggered By",
    jobType: "Job Type",
    associatedCredential: "Associated Credential",

    // Sync Dashboard
    syncDashboard: "Sync Dashboard",
    syncDashboardDescription: "Manage data sync tasks and platform status",

    // Service Degradation
    metricsUnavailable: "Metrics temporarily unavailable",
    databaseConnectionError: "Database connection error",
    serviceTemporarilyUnavailable: "Service temporarily unavailable",
    galleryDataInaccessible: "Gallery data is currently inaccessible",
    postsDataInaccessible: "Posts data is currently inaccessible",
    recentUploads: "Recent Uploads",
    recentPosts: "Recent Posts",
    noUploadsYet: "No uploads yet",
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
    subscriptions: "订阅管理",
    subscriptionManagement: "订阅管理",
    subscriptionDescription: "记录订阅项目与成本",
    createNewSubscription: "创建和管理您的订阅",
    credentials: "凭据管理",
    credentialManagement: "凭据管理",
    credentialDescription: "管理 API 密钥、Cookie 和身份验证令牌",

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

    // Analytics
    analytics: "访问统计",
    analyticsDescription: "流量洞察",
    viewAnalytics: "查看统计",
    trafficInsights: "网站流量和访客统计",
    todayVisits: "今日访问",
    weeklyVisits: "本周访问",
    totalVisitors: "总访客数",
    avgVisits: "平均访问",
    dailyAverage: "每日平均",
    trendChart: "7天访问趋势",
    topPages: "热门页面",
    languageDistribution: "语言分布",
    noDataYet: "暂无数据",
    uniqueVisitors: "独立访客",
    visits: "次",
    registeredUsers: "注册用户",

    // Page types
    postsType: "文章",
    galleryType: "相册",
    momentsType: "动态",
    otherType: "其他",
    viewAll: "查看全部",
    showLess: "收起",
    vsLastWeek: "较上周",
    percentage: "占比",
    title: "标题",
    subscriptionOverview: "订阅概览",
    subscriptionList: "订阅条目",
    addSubscription: "新增订阅",
    editSubscription: "编辑订阅",
    deleteSubscription: "删除订阅",
    monthlyView: "月度视图",
    annualView: "年度视图",
    markdownExport: "导出为 Markdown",
    subscriptionName: "订阅名称",
    originalAmount: "原币金额",
    convertedAmount: "折算金额",
    billingCycle: "计费周期",
    startDate: "开始日期",
    endDate: "结束日期",
    currency: "币种",
    notes: "备注",
    monthlyTotal: "月度总额",
    annualTotal: "年度总额",
    chartSubscriptions: "订阅费用对比",
    chartTrend: "支出趋势",
    noSubscriptions: "暂无订阅记录",
    createFirstSubscription: "创建第一条订阅记录即可开始统计。",
    saveChanges: "保存",
    cancel: "取消",
    confirmDelete: "确认删除此订阅？",
    confirmDeleteDescription: "该操作会永久删除订阅记录，无法恢复。",
    newSubscription: "新建订阅",
    updateSubscription: "更新订阅",
    exportReady: "订阅数据已导出为 Markdown。",
    copyMarkdown: "复制 Markdown",
    downloadMarkdown: "下载 Markdown",
    monthlySpend: "月度支出",
    annualSpend: "年度支出",
    markdownExportDescription: "导出当前订阅数据的 Markdown 快照。",
    filterByCycle: "按计费周期筛选",
    noEndDate: "无结束日期",
    progress: "进度",
    trendDescription: "月度支出趋势",
    currentMonth: "当前月份",

    // Credentials
    credentialList: "凭据列表",
    addCredential: "添加凭据",
    editCredential: "编辑凭据",
    deleteCredential: "删除凭据",
    validateCredential: "验证",
    credentialName: "凭据名称",
    credentialType: "类型",
    credentialValue: "值",
    credentialPlatform: "平台",
    credentialStatus: "状态",
    credentialMetadata: "元数据",
    credentialCreatedAt: "创建时间",
    credentialUpdatedAt: "更新时间",
    lastValidated: "最后验证",
    validUntil: "有效期至",
    lastUsed: "最后使用",
    usageCount: "使用次数",
    failureCount: "失败次数",
    lastError: "最后错误",
    isValid: "有效",
    isInvalid: "无效",
    validationSuccess: "验证成功",
    validationFailed: "验证失败",

    // Credential Types
    apiKey: "API 密钥",
    cookie: "Cookie",
    oauthToken: "OAuth 令牌",

    // Platforms
    steam: "Steam",
    hoyoverse: "米哈游",
    bilibili: "哔哩哔哩",
    douban: "豆瓣",
    jellyfin: "Jellyfin",

    // Credential Form
    enterCredentialName: "输入凭据名称",
    enterCredentialValue: "输入凭据值",
    selectCredentialType: "选择凭据类型",
    selectPlatform: "选择平台",
    optionalMetadata: "可选元数据（JSON）",
    credentialValuePlaceholder: "在此粘贴您的凭据值",

    // Credential Actions
    noCredentials: "暂无凭据",
    createFirstCredential: "创建第一个凭据以开始使用。",
    confirmDeleteCredential: "删除此凭据？",
    confirmDeleteCredentialDescription: "此操作将永久删除凭据，无法撤销。",
    credentialSaved: "凭据保存成功",
    credentialDeleted: "凭据删除成功",
    credentialValidated: "凭据已验证",

    // Sync Jobs
    syncJobs: "同步任务",
    syncJobId: "任务 ID",
    syncJobPlatform: "平台",
    syncJobStatus: "状态",
    syncJobStartedAt: "开始时间",
    syncJobCompletedAt: "完成时间",
    syncJobDuration: "持续时间",
    syncJobItemsTotal: "总条目",
    syncJobItemsSuccess: "成功",
    syncJobItemsFailed: "失败",
    syncJobMessage: "消息",
    syncJobError: "错误",
    triggeredBy: "触发者",
    jobType: "任务类型",
    associatedCredential: "关联凭据",

    // Sync Dashboard
    syncDashboard: "同步仪表板",
    syncDashboardDescription: "管理数据同步任务和平台状态",

    // Service Degradation
    metricsUnavailable: "指标暂时不可用",
    databaseConnectionError: "数据库连接错误",
    serviceTemporarilyUnavailable: "服务暂时不可用",
    galleryDataInaccessible: "相册数据暂时无法访问",
    postsDataInaccessible: "文章数据暂时无法访问",
    recentUploads: "最近上传",
    recentPosts: "最近文章",
    noUploadsYet: "暂无上传",
  },
} as const;

/**
 * Get translated text (Client-safe)
 */
export function t(locale: AdminLocale, key: keyof typeof adminTranslations.en): string {
  return adminTranslations[locale][key];
}
