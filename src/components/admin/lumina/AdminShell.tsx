"use client";

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutTemplate, Home, FileText, Image as ImageIcon,
    Briefcase, Link2, Camera, Layers, Users, CreditCard,
    Key, LogOut, Menu, X, Database, TrendingUp, Sun, Moon,
    CheckCircle2, AlertCircle, Languages
} from 'lucide-react';
import { useSettings } from './store';
import { adminTranslations, type AdminLocale } from '@/lib/admin-translations';

interface AdminShellProps {
    user: {
        username: string;
        email: string;
        role: string;
    };
    children: React.ReactNode;
    pageTitle: string;
    pageDescription?: string;
}

type NavItem = {
    id: string;
    href: string;
    icon: React.ReactNode;
    labelKey: keyof typeof adminTranslations.en;
};

const contentNavItems: NavItem[] = [
    { id: 'overview', href: '/admin', icon: <LayoutTemplate size={18} />, labelKey: 'overview' },
    { id: 'analytics', href: '/admin/analytics', icon: <TrendingUp size={18} />, labelKey: 'analytics' },
    { id: 'posts', href: '/admin/articles', icon: <FileText size={18} />, labelKey: 'posts' },
    { id: 'moments', href: '/admin/moments', icon: <ImageIcon size={18} />, labelKey: 'moments' },
    { id: 'projects', href: '/admin/projects', icon: <Briefcase size={18} />, labelKey: 'projects' },
    { id: 'curated', href: '/admin/curated', icon: <Link2 size={18} />, labelKey: 'curated' },
    { id: 'gallery', href: '/admin/gallery', icon: <Camera size={18} />, labelKey: 'gallery' },
];

const systemNavItems: NavItem[] = [
    { id: 'hero', href: '/admin/hero', icon: <Layers size={18} />, labelKey: 'heroImages' },
    { id: 'data', href: '/admin/data', icon: <Database size={18} />, labelKey: 'lifeLogData' },
    { id: 'friends', href: '/admin/friends', icon: <Users size={18} />, labelKey: 'friends' },
    { id: 'subscriptions', href: '/admin/subscriptions', icon: <CreditCard size={18} />, labelKey: 'subscriptions' },
    { id: 'credentials', href: '/admin/credentials', icon: <Key size={18} />, labelKey: 'credentials' },
];

const NavLink: React.FC<{ item: NavItem; isActive: boolean; locale: AdminLocale }> = ({ item, isActive, locale }) => {
    return (
        <Link
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-sage-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            }`}
        >
            {item.icon} <span>{adminTranslations[locale][item.labelKey]}</span>
        </Link>
    );
};

// Toast component for notifications
interface ToastData {
    message: string;
    type: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastData & { onClose: () => void }> = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500';
    const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : AlertCircle;

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X size={16} />
            </button>
        </div>
    );
};

export const AdminShell: React.FC<AdminShellProps> = ({ user, children, pageTitle, pageDescription }) => {
    const { theme, toggleTheme, language, setLanguage } = useSettings();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [toast, setToast] = useState<ToastData | null>(null);

    // Use settings language as admin locale
    const adminLocale: AdminLocale = language === 'zh' ? 'zh' : 'en';
    const t = (key: keyof typeof adminTranslations.en) => adminTranslations[adminLocale][key];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    const defaultDescription = adminLocale === 'zh' ? '管理您的内容和设置' : 'Manage your content and settings';

    // Page title translations
    const pageTitleTranslations: Record<string, { en: string; zh: string }> = {
        'Overview': { en: 'Overview', zh: '概览' },
        'Analytics': { en: 'Analytics', zh: '访问统计' },
        'Posts': { en: 'Posts', zh: '文章管理' },
        'Moments': { en: 'Moments', zh: '动态管理' },
        'Projects': { en: 'Projects', zh: '项目管理' },
        'Curated Links': { en: 'Curated Links', zh: '精选链接' },
        'Gallery': { en: 'Gallery', zh: '相册管理' },
        'Hero Images': { en: 'Hero Images', zh: '头图管理' },
        'Life Log Data': { en: 'Life Log Data', zh: '生活数据' },
        'Friends & Access': { en: 'Friends & Access', zh: '朋友管理' },
        'Subscriptions': { en: 'Subscriptions', zh: '订阅管理' },
        'Credentials & Sync': { en: 'Credentials & Sync', zh: '凭据与同步' },
    };

    const pageDescriptionTranslations: Record<string, { en: string; zh: string }> = {
        'Manage your content and settings': { en: 'Manage your content and settings', zh: '管理您的内容和设置' },
        'View site analytics and traffic statistics': { en: 'View site analytics and traffic statistics', zh: '查看网站流量和访问统计' },
        'Manage your moments and quick updates': { en: 'Manage your moments and quick updates', zh: '管理您的动态和快速更新' },
        'Manage your projects and work': { en: 'Manage your projects and work', zh: '管理您的项目和作品' },
        'Manage curated content and links': { en: 'Manage curated content and links', zh: '管理精选内容和链接' },
        'Manage your media gallery': { en: 'Manage your media gallery', zh: '管理您的媒体相册' },
        'Manage hero image shuffle grid': { en: 'Manage hero image shuffle grid', zh: '管理首页头图展示' },
        'Manage your life data and statistics': { en: 'Manage your life data and statistics', zh: '管理您的生活数据和统计' },
        'Manage friend access codes and permissions': { en: 'Manage friend access codes and permissions', zh: '管理朋友访问权限' },
        'Manage your service subscriptions': { en: 'Manage your service subscriptions', zh: '管理您的服务订阅' },
        'Manage API credentials and sync settings': { en: 'Manage API credentials and sync settings', zh: '管理 API 凭据和同步设置' },
    };

    const translatedTitle = pageTitleTranslations[pageTitle]?.[adminLocale] || pageTitle;
    const translatedDescription = pageDescription 
        ? (pageDescriptionTranslations[pageDescription]?.[adminLocale] || pageDescription)
        : defaultDescription;

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    // NOTE: Export/Import functions preserved for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleExport = async () => {
        try {
            const response = await fetch('/api/admin/content/export');
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Export failed');
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content-export-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Content exported successfully!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast(error instanceof Error ? error.message : 'Export failed', 'error');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/content/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Import failed');
            }

            showToast(`Imported: ${data.imported?.posts || 0} posts, ${data.imported?.moments || 0} moments`, 'success');
            // Refresh the page to show new content
            router.refresh();
        } catch (error) {
            console.error('Import failed:', error);
            showToast(error instanceof Error ? error.message : 'Import failed', 'error');
        } finally {
            // Reset the file input
            event.target.value = '';
        }
    };

    const isActiveRoute = (item: NavItem) => {
        // Exact match for /admin
        if (item.href === '/admin') {
            return pathname === '/admin';
        }
        // Starts with for other routes
        return pathname.startsWith(item.href);
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-black text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300 flex">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-stone-900 text-stone-300 w-64 transform transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-900 font-bold font-serif">L</div>
                        <h1 className="text-xl font-bold text-white tracking-tight">ZHI CMS</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-stone-400"><X /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-4">{t('content')}</div>
                    {contentNavItems.map(item => (
                        <NavLink key={item.id} item={item} isActive={isActiveRoute(item)} locale={adminLocale} />
                    ))}

                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-6">{t('system')}</div>
                    {systemNavItems.map(item => (
                        <NavLink key={item.id} item={item} isActive={isActiveRoute(item)} locale={adminLocale} />
                    ))}
                </nav>

                <div className="p-4 border-t border-stone-800">
                    {/* Quick Actions - Grid Layout */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4 bg-stone-800/50 p-1.5 rounded-lg">
                        <button
                            onClick={() => router.push('/')}
                            className="flex flex-col items-center justify-center gap-1 py-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-md transition-colors cursor-pointer"
                            title={adminLocale === 'zh' ? '返回主页' : 'Back to site'}
                        >
                            <Home size={16} />
                            <span className="text-[10px]">{adminLocale === 'zh' ? '主页' : 'Home'}</span>
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="flex flex-col items-center justify-center gap-1 py-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-md transition-colors cursor-pointer"
                            title={adminLocale === 'zh' ? '切换主题' : 'Toggle theme'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            <span className="text-[10px]">{theme === 'dark' ? (adminLocale === 'zh' ? '浅色' : 'Light') : (adminLocale === 'zh' ? '深色' : 'Dark')}</span>
                        </button>
                        <button
                            onClick={toggleLanguage}
                            className="flex flex-col items-center justify-center gap-1 py-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-md transition-colors cursor-pointer"
                            title={adminLocale === 'zh' ? '切换语言' : 'Toggle language'}
                        >
                            <Languages size={16} />
                            <span className="text-[10px]">{adminLocale === 'zh' ? 'EN' : '中文'}</span>
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-stone-600"></div>
                        <div>
                            <div className="text-sm font-bold text-white">{user.username}</div>
                            <div className="text-xs text-stone-500 capitalize">{user.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/signout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            router.push('/login');
                            router.refresh();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors text-sm cursor-pointer"
                    >
                        <LogOut size={16} /> {adminLocale === 'zh' ? '退出登录' : 'Sign Out'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto bg-stone-50 dark:bg-black relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center sticky top-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-stone-600 dark:text-stone-300"><Menu /></button>
                    <span className="font-bold text-stone-900 dark:text-stone-100">ZHI CMS</span>
                    <div className="w-8"></div>
                </header>

                <div className="p-6 lg:p-10">
                    {/* Top Bar */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{translatedTitle}</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">{translatedDescription}</p>
                    </div>

                    {/* Page Content */}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminShell;
