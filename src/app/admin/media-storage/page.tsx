'use client';

import { useState, useEffect, useCallback } from 'react';
import { Film, Book, Gamepad2, Search } from 'lucide-react';

interface MediaItem {
    id: string;
    title: string;
    platform: string;
    type: string;           // Changed from category
    externalId: string;
    cover?: string;
    url?: string;
    rating?: number;
    progress?: number;
    season?: number;
    episode?: number;
    duration?: number;
    watchedAt: string;
    createdAt: string;
    updatedAt: string;
}

export default function MediaStoragePage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        bilibili: 0,
        douban: 0,
        steam: 0,
    });

    const fetchMediaData = useCallback(async () => {
        setLoading(true);
        try {
            // Build API URL with platform filter if not 'all'
            const url = filter === 'all'
                ? '/api/admin/media'
                : `/api/admin/media?platform=${filter}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setItems(data.items || []);

                // Calculate stats - always fetch all platforms for stats
                if (filter === 'all') {
                    const total = data.items?.length || 0;
                    const bilibili = data.items?.filter((i: MediaItem) => i.platform === 'BILIBILI').length || 0;
                    const douban = data.items?.filter((i: MediaItem) => i.platform === 'DOUBAN').length || 0;
                    const steam = data.items?.filter((i: MediaItem) => i.platform === 'STEAM').length || 0;
                    setStats({ total, bilibili, douban, steam });
                } else {
                    // When filtering, only update the filtered platform's count
                    setStats(prev => ({
                        ...prev,
                        [filter.toLowerCase()]: data.items?.length || 0
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch media data:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]); // Now dependency is stable

    useEffect(() => {
        fetchMediaData();
    }, [fetchMediaData]); // Depend on the memoized function

    const filteredItems = items.filter(item => {
        const matchesSearch = !search ||
            item.title.toLowerCase().includes(search.toLowerCase());
        return matchesSearch; // No need to filter by platform, API already does it
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'BILIBILI': return <Film size={16} className="text-pink-500" />;
            case 'DOUBAN': return <Book size={16} className="text-green-500" />;
            case 'STEAM': return <Gamepad2 size={16} className="text-blue-500" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">媒体存储</h1>
                    <p className="text-stone-600 dark:text-stone-400 mt-1">查看所有已同步并存储的媒体内容</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="全部" count={stats.total} color="stone" />
                    <StatCard title="Bilibili" count={stats.bilibili} color="pink" icon={<Film size={18} />} />
                    <StatCard title="豆瓣" count={stats.douban} color="green" icon={<Book size={18} />} />
                    <StatCard title="Steam" count={stats.steam} color="blue" icon={<Gamepad2 size={18} />} />
                </div>

                {/* Filters & Search */}
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="搜索标题..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['all', 'BILIBILI', 'DOUBAN', 'STEAM'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg transition ${filter === f
                                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
                                    }`}
                            >
                                {f === 'all' ? '全部' : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Items List */}
                <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                    {loading ? (
                        <div className="p-12 text-center text-stone-500">加载中...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-12 text-center text-stone-500">
                            {search ? '未找到匹配的内容' : '暂无存储内容'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">平台</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">标题</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">类型</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">进度</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">评分</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">观看时间</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {getPlatformIcon(item.platform)}
                                                    <span className="text-xs font-mono text-stone-600 dark:text-stone-400">
                                                        {item.platform}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                                    {item.title}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-stone-600 dark:text-stone-400">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-stone-600 dark:text-stone-400">
                                                    {item.progress ? `${item.progress}%` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.rating ? (
                                                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                                        ⭐ {item.rating}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-stone-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                                                {formatDate(item.watchedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, count, color, icon }: any) {
    const colorClasses = {
        stone: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
        pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    };

    return (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{title}</p>
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">{count}</p>
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
