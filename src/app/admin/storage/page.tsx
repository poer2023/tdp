'use client';

import { useState, useEffect, useCallback } from 'react';
import { HardDrive, Image, Video, File, Trash2, RefreshCw, ExternalLink, Search, Grid, List } from 'lucide-react';
import NextImage from 'next/image';

interface StorageFile {
    key: string;
    size: number;
    lastModified: string;
    url: string;
    type: 'image' | 'video' | 'other';
}

interface StorageStats {
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
}

interface StorageData {
    provider: string;
    configured?: boolean;
    accessible?: boolean;
    bucket?: string;
    cdnUrl?: string;
    files: StorageFile[];
    stats: StorageStats;
    message?: string;
}

export default function StorageManagementPage() {
    const [data, setData] = useState<StorageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'other'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchStorageData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/storage');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch storage data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStorageData();
    }, [fetchStorageData]);

    const handleDelete = async (key: string) => {
        if (!confirm(`确定要删除 ${key}？此操作不可恢复。`)) return;

        setDeleting(key);
        try {
            const response = await fetch(`/api/admin/storage/${encodeURIComponent(key)}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setData(prev => prev ? {
                    ...prev,
                    files: prev.files.filter(f => f.key !== key),
                    stats: {
                        ...prev.stats,
                        totalFiles: prev.stats.totalFiles - 1,
                    },
                } : null);
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('删除失败');
        } finally {
            setDeleting(null);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredFiles = data?.files.filter(file => {
        const matchesSearch = !search || file.key.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || file.type === typeFilter;
        return matchesSearch && matchesType;
    }) || [];

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image size={16} className="text-green-500" />;
            case 'video': return <Video size={16} className="text-purple-500" />;
            default: return <File size={16} className="text-stone-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">存储管理</h1>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">
                            管理 {data?.provider === 'r2' ? 'Cloudflare R2' : data?.provider === 's3' ? 'S3' : '本地'} 存储中的文件
                        </p>
                    </div>
                    <button
                        onClick={fetchStorageData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        刷新
                    </button>
                </div>

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            title="存储状态"
                            value={data.accessible ? '已连接' : data.configured ? '无法访问' : '未配置'}
                            color={data.accessible ? 'green' : 'red'}
                            icon={<HardDrive size={18} />}
                        />
                        <StatCard
                            title="文件总数"
                            value={data.stats.totalFiles.toString()}
                            color="blue"
                            icon={<File size={18} />}
                        />
                        <StatCard
                            title="图片"
                            value={(data.stats.byType.image || 0).toString()}
                            color="green"
                            icon={<Image size={18} />}
                        />
                        <StatCard
                            title="视频"
                            value={(data.stats.byType.video || 0).toString()}
                            color="purple"
                            icon={<Video size={18} />}
                        />
                    </div>
                )}

                {/* Storage Info */}
                {data?.bucket && (
                    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-stone-500">Bucket:</span>
                            <code className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-stone-700 dark:text-stone-300">
                                {data.bucket}
                            </code>
                            {data.cdnUrl && (
                                <>
                                    <span className="text-stone-500">CDN:</span>
                                    <code className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-stone-700 dark:text-stone-300">
                                        {data.cdnUrl}
                                    </code>
                                </>
                            )}
                            <span className="text-stone-500">总大小:</span>
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                                {formatSize(data.stats.totalSize)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="搜索文件名..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {(['all', 'image', 'video', 'other'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-2 rounded-lg transition ${typeFilter === type
                                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
                                    }`}
                            >
                                {type === 'all' ? '全部' : type === 'image' ? '图片' : type === 'video' ? '视频' : '其他'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1 border border-stone-200 dark:border-stone-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-stone-200 dark:bg-stone-700' : ''}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-stone-200 dark:bg-stone-700' : ''}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* File List */}
                {loading ? (
                    <div className="p-12 text-center text-stone-500">加载中...</div>
                ) : !data?.accessible ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                        <p className="text-amber-800 dark:text-amber-200">{data?.message || '存储未配置或无法访问'}</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="p-12 text-center text-stone-500">
                        {search || typeFilter !== 'all' ? '未找到匹配的文件' : '存储中暂无文件'}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.key}
                                className="group bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-lg transition"
                            >
                                <div className="aspect-square relative bg-stone-100 dark:bg-stone-800">
                                    {file.type === 'image' ? (
                                        <NextImage
                                            src={file.url}
                                            alt={file.key}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : file.type === 'video' ? (
                                        <video
                                            src={file.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => e.currentTarget.pause()}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <File size={48} className="text-stone-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white rounded-lg hover:bg-stone-100 transition"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file.key)}
                                            disabled={deleting === file.key}
                                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs text-stone-600 dark:text-stone-400 truncate" title={file.key}>
                                        {file.key.split('/').pop()}
                                    </p>
                                    <p className="text-xs text-stone-400">{formatSize(file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                        <table className="w-full">
                            <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">类型</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">文件名</th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">大小</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">修改时间</th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {filteredFiles.map((file) => (
                                    <tr key={file.key} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                                        <td className="px-4 py-3">{getFileIcon(file.type)}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{file.key}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm text-stone-600 dark:text-stone-400">{formatSize(file.size)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-stone-600 dark:text-stone-400">{formatDate(file.lastModified)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(file.key)}
                                                    disabled={deleting === file.key}
                                                    className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    color,
    icon,
}: {
    title: string;
    value: string;
    color: 'green' | 'blue' | 'purple' | 'red';
    icon: React.ReactNode;
}) {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };

    return (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{title}</p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
