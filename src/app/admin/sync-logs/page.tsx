'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

interface SyncLog {
    id: string;
    platform: string;
    triggerType: string;
    status: string;
    success: boolean;
    itemsTotal: number;
    itemsSuccess: number;
    itemsFailed: number;
    itemsNew: number;
    itemsExisting: number;
    duration: number | null;
    errorMessage: string | null;
    aiAssisted: boolean;
    startedAt: string;
    completedAt: string | null;
    credential?: {
        id: string;
        platform: string;
        metadata: any;
    };
}

interface SyncStats {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    successRate: number;
    manualSyncs: number;
    autoSyncs: number;
    avgDurationMs: number;
    totalItemsSynced: number;
    totalNewItems: number;
}

export default function SyncLogsPage() {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchLogsAndStats();

        // Poll every 3 seconds to update running syncs
        const interval = setInterval(() => {
            fetchLogsAndStats();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const fetchLogsAndStats = async () => {
        setLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                fetch('/api/admin/sync-logs?limit=100'),
                fetch('/api/admin/sync-logs?stats=true'),
            ]);

            const logsData = await logsRes.json();
            const statsData = await statsRes.json();

            if (logsData.success) setLogs(logsData.logs);
            if (statsData.success) setStats(statsData.stats);
        } catch (error) {
            console.error('Failed to fetch sync logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'success') return log.success;
        if (filter === 'failed') return !log.success;
        if (filter === 'manual') return log.triggerType === 'MANUAL';
        if (filter === 'auto') return log.triggerType === 'AUTO';
        return true;
    });

    const formatDuration = (ms: number | null) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">同步日志</h1>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">查看所有凭据同步操作记录</p>
                    </div>
                    <button
                        onClick={fetchLogsAndStats}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition"
                    >
                        <RefreshCw size={16} />
                        刷新
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<TrendingUp className="text-blue-500" />}
                            title="总同步次数"
                            value={stats.totalSyncs}
                            subtitle={`成功率 ${stats.successRate.toFixed(1)}%`}
                        />
                        <StatCard
                            icon={<CheckCircle2 className="text-emerald-500" />}
                            title="成功"
                            value={stats.successfulSyncs}
                            subtitle={`失败 ${stats.failedSyncs} 次`}
                        />
                        <StatCard
                            icon={<Clock className="text-amber-500" />}
                            title="平均耗时"
                            value={formatDuration(stats.avgDurationMs)}
                            subtitle={`手动 ${stats.manualSyncs} / 自动 ${stats.autoSyncs}`}
                        />
                        <StatCard
                            icon={<Zap className="text-purple-500" />}
                            title="同步项目"
                            value={stats.totalItemsSynced.toLocaleString()}
                            subtitle={`新增 ${stats.totalNewItems.toLocaleString()}`}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {['all', 'success', 'failed', 'manual', 'auto'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg transition ${filter === f
                                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
                                }`}
                        >
                            {f === 'all' && '全部'}
                            {f === 'success' && '成功'}
                            {f === 'failed' && '失败'}
                            {f === 'manual' && '手动'}
                            {f === 'auto' && '自动'}
                        </button>
                    ))}
                </div>

                {/* Logs Table */}
                <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-stone-500">加载中...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-stone-500">暂无日志记录</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">状态</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">平台</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">触发方式</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">项目数</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">新增</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">耗时</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">时间</th>
                                        <th className="text-center px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                                            <td className="px-4 py-3">
                                                {log.status === 'RUNNING' ? (
                                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <Clock size={16} className="animate-spin" />
                                                        <span className="text-sm">进行中</span>
                                                    </span>
                                                ) : log.success ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 size={16} />
                                                        <span className="text-sm">成功</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                                        <XCircle size={16} />
                                                        <span className="text-sm">失败</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm text-stone-900 dark:text-stone-100">{log.platform}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${log.triggerType === 'MANUAL'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                    }`}>
                                                    {log.triggerType === 'MANUAL' ? '手动' : '自动'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-stone-700 dark:text-stone-300">
                                                {log.itemsSuccess}/{log.itemsTotal}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                {log.itemsNew}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-stone-600 dark:text-stone-400">
                                                {formatDuration(log.duration)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                                                {formatDate(log.startedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <a
                                                    href={`/admin/sync-logs/${log.id}`}
                                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    查看详情
                                                </a>
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

function StatCard({ icon, title, value, subtitle }: any) {
    return (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{title}</p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{value}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">{subtitle}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    {icon}
                </div>
            </div>
        </div>
    );
}
