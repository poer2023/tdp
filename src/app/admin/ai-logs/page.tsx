'use client';

import { useState, useEffect } from 'react';
import { Brain, RefreshCw, TrendingUp, Wrench, DollarSign } from 'lucide-react';

interface AIDiagnosisLog {
    id: string;
    platform: string;
    errorType: string;
    errorMessage: string;
    aiReason: string;
    aiSolution: string;
    canAutoFix: boolean;
    confidence: number;
    autoFixApplied: boolean;
    autoFixSuccess: boolean | null;
    tokensUsed: number | null;
    costYuan: number | null;
    createdAt: string;
}

interface AIStats {
    totalDiagnoses: number;
    autoFixable: number;
    fixesApplied: number;
    fixesSuccessful: number;
    totalCostYuan: number;
}

export default function AIDiagnosisLogsPage() {
    const [logs, setLogs] = useState<AIDiagnosisLog[]>([]);
    const [stats, setStats] = useState<AIStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [_selectedLog, setSelectedLog] = useState<AIDiagnosisLog | null>(null);

    useEffect(() => {
        fetchLogsAndStats();
    }, []);

    const fetchLogsAndStats = async () => {
        setLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                fetch('/api/admin/ai-logs?limit=100'),
                fetch('/api/admin/ai-logs?stats=true'),
            ]);

            const logsData = await logsRes.json();
            const statsData = await statsRes.json();

            if (logsData.success) setLogs(logsData.logs);
            if (statsData.success) setStats(statsData.stats);
        } catch (error) {
            console.error('Failed to fetch AI diagnosis logs:', error);
        } finally {
            setLoading(false);
        }
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
                        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <Brain className="text-purple-500" />
                            AI 诊断日志
                        </h1>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">查看所有 AI 驱动的错误诊断记录</p>
                    </div>
                    <button
                        onClick={fetchLogsAndStats}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <RefreshCw size={16} />
                        刷新
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Brain className="text-purple-500" />}
                            title="总诊断次数"
                            value={stats.totalDiagnoses}
                            subtitle="AI 驱动诊断"
                        />
                        <StatCard
                            icon={<Wrench className="text-amber-500" />}
                            title="可自动修复"
                            value={stats.autoFixable}
                            subtitle={`已应用 ${stats.fixesApplied} 次`}
                        />
                        <StatCard
                            icon={<TrendingUp className="text-emerald-500" />}
                            title="修复成功率"
                            value={stats.fixesApplied > 0 ? `${((stats.fixesSuccessful / stats.fixesApplied) * 100).toFixed(0)}%` : '0%'}
                            subtitle={`成功 ${stats.fixesSuccessful} / ${stats.fixesApplied}`}
                        />
                        <StatCard
                            icon={<DollarSign className="text-blue-500" />}
                            title="累计成本"
                            value={`¥${stats.totalCostYuan.toFixed(2)}`}
                            subtitle="DeepSeek API 费用"
                        />
                    </div>
                )}

                {/* Logs List */}
                <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-stone-500">加载中...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-stone-500">
                            <Brain size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-700" />
                            <p>暂无 AI 诊断记录</p>
                            <p className="text-sm mt-2">当同步失败时，AI 会自动诊断并记录</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-6 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition cursor-pointer"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Brain size={20} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">
                                                        {log.platform}
                                                    </span>
                                                    <span className="text-sm text-stone-500 dark:text-stone-500">·</span>
                                                    <span className="text-sm text-stone-600 dark:text-stone-400">{log.errorType}</span>
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">{formatDate(log.createdAt)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {log.canAutoFix && (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                    可自动修复
                                                </span>
                                            )}
                                            {log.autoFixApplied && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${log.autoFixSuccess
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                                                    }`}>
                                                    {log.autoFixSuccess ? '修复成功' : '修复失败'}
                                                </span>
                                            )}
                                            <span className="text-xs text-stone-500">
                                                置信度 {(log.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4 mb-3">
                                        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">🔍 AI 诊断：</p>
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{log.aiReason}</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">💡 建议方案：</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">{log.aiSolution}</p>
                                    </div>

                                    {log.costYuan && (
                                        <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                                            <span>Tokens: {log.tokensUsed?.toLocaleString()}</span>
                                            <span>成本: ¥{log.costYuan.toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
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
