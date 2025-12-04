"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutTemplate, Home, FileText, Image as ImageIcon,
    Briefcase, Link2, Camera, Layers, Users, CreditCard,
    Key, LogOut, Menu, X, Database, TrendingUp
} from 'lucide-react';
import { useSettings } from './store';

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
    label: string;
};

const contentNavItems: NavItem[] = [
    { id: 'overview', href: '/admin', icon: <LayoutTemplate size={18} />, label: 'Overview' },
    { id: 'analytics', href: '/admin/analytics', icon: <TrendingUp size={18} />, label: 'Analytics' },
    { id: 'posts', href: '/admin/articles', icon: <FileText size={18} />, label: 'Articles' },
    { id: 'moments', href: '/admin/moments', icon: <ImageIcon size={18} />, label: 'Moments' },
    { id: 'projects', href: '/admin/projects', icon: <Briefcase size={18} />, label: 'Projects' },
    { id: 'curated', href: '/admin/curated', icon: <Link2 size={18} />, label: 'Curated' },
    { id: 'gallery', href: '/admin/gallery', icon: <Camera size={18} />, label: 'Gallery' },
];

const systemNavItems: NavItem[] = [
    { id: 'hero', href: '/admin/hero', icon: <Layers size={18} />, label: 'Hero Grid' },
    { id: 'data', href: '/admin/data', icon: <Database size={18} />, label: 'Life Data' },
    { id: 'friends', href: '/admin/friends', icon: <Users size={18} />, label: 'Friends' },
    { id: 'subscriptions', href: '/admin/subscriptions', icon: <CreditCard size={18} />, label: 'Subscriptions' },
    { id: 'credentials', href: '/admin/credentials', icon: <Key size={18} />, label: 'Credentials' },
];

const NavLink: React.FC<{ item: NavItem; isActive: boolean }> = ({ item, isActive }) => {
    return (
        <Link
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-sage-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            }`}
        >
            {item.icon} <span>{item.label}</span>
        </Link>
    );
};

export const AdminShell: React.FC<AdminShellProps> = ({ user, children, pageTitle, pageDescription = "Manage your content and settings" }) => {
    const { theme, toggleTheme } = useSettings();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-stone-900 text-stone-300 w-64 transform transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-900 font-bold font-serif">L</div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Lumina CMS</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-stone-400"><X /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-4">Content</div>
                    {contentNavItems.map(item => (
                        <NavLink key={item.id} item={item} isActive={isActiveRoute(item)} />
                    ))}

                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-6">System</div>
                    {systemNavItems.map(item => (
                        <NavLink key={item.id} item={item} isActive={isActiveRoute(item)} />
                    ))}
                </nav>

                <div className="p-4 border-t border-stone-800">
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
                        className="w-full flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto bg-stone-50 dark:bg-black relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center sticky top-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-stone-600 dark:text-stone-300"><Menu /></button>
                    <span className="font-bold text-stone-900 dark:text-stone-100">Lumina Admin</span>
                    <div className="w-8"></div>
                </header>

                <div className="p-6 lg:p-10">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 capitalize">{pageTitle}</h2>
                            <p className="text-sm text-stone-500 dark:text-stone-400">{pageDescription}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => router.push('/')} className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors" title="View Site">
                                <Home size={20} />
                            </button>
                            <button onClick={toggleTheme} className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>

                    {/* Page Content */}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminShell;
