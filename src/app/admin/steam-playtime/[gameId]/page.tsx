'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GameDetail {
    gameId: string;
    gameName: string;
    gameCover: string | null;
    appId: string;
}

interface PlaytimeHistory {
    date: string;
    playtime: number;
    dailyDelta: number | null;
}

interface GameStats {
    totalPlaytime: number;
    averageDaily: number;
    maxDaily: number;
    daysActive: number;
}

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.gameId as string;

    const [loading, setLoading] = useState(true);
    const [steamId, setSteamId] = useState('');
    const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
    const [history, setHistory] = useState<PlaytimeHistory[]>([]);
    const [stats, setStats] = useState<GameStats | null>(null);

    useEffect(() => {
        fetchSteamId();
    }, []);

    const fetchGameData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch last 30 days history
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await fetch(
                `/api/admin/steam/playtime-history?steamId=${steamId}&gameId=${gameId}&type=history&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const historyData = data.data;
                setHistory(historyData);

                // Extract game details from first record
                setGameDetail({
                    gameId,
                    gameName: historyData[0].gameName,
                    gameCover: historyData[0].gameCover,
                    appId: '', // Not needed for display
                });

                // Calculate stats
                const deltas = historyData.filter((h: PlaytimeHistory) => h.dailyDelta && h.dailyDelta > 0);
                const totalDelta = deltas.reduce((sum: number, h: PlaytimeHistory) => sum + (h.dailyDelta || 0), 0);
                const maxDelta = Math.max(...deltas.map((h: PlaytimeHistory) => h.dailyDelta || 0));

                setStats({
                    totalPlaytime: historyData[historyData.length - 1].playtime,
                    averageDaily: deltas.length > 0 ? Math.round(totalDelta / deltas.length) : 0,
                    maxDaily: maxDelta,
                    daysActive: deltas.length,
                });
            }
        } catch (error) {
            console.error('Failed to fetch game data:', error);
        } finally {
            setLoading(false);
        }
    }, [steamId, gameId]);

    useEffect(() => {
        if (steamId && gameId) {
            fetchGameData();
        }
    }, [steamId, gameId, fetchGameData]);

    const fetchSteamId = async () => {
        try {
            const response = await fetch('/api/admin/credentials?platform=STEAM');
            const data = await response.json();
            if (data.credentials && data.credentials.length > 0) {
                const metadata = data.credentials[0].metadata as { steamId?: string } | null;
                setSteamId(metadata?.steamId || '');
            }
        } catch (error) {
            console.error('Failed to fetch credentials:', error);
        }
    };

    // fetchGameData moved above useEffect via useCallback

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const chartData = history.map(h => ({
        date: new Date(h.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        dailyMinutes: h.dailyDelta || 0,
        totalHours: Math.round(h.playtime / 60 * 10) / 10,
    }));

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-4"
                    >
                        <ArrowLeft size={20} />
                        返回
                    </button>

                    {gameDetail && (
                        <div className="flex items-start gap-4">
                            {gameDetail.gameCover && (
                                <Image
                                    src={gameDetail.gameCover}
                                    alt={gameDetail.gameName}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 rounded-lg object-cover"
                                    // unoptimized: Steam CDN covers not in remotePatterns, admin panel only
                                    unoptimized
                                />
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                                    {gameDetail.gameName}
                                </h1>
                                <p className="text-stone-600 dark:text-stone-400 mt-1">最近30天游戏时长</p>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-stone-500">加载中...</div>
                ) : !stats ? (
                    <div className="p-12 text-center text-stone-500">暂无数据</div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<Clock className="text-blue-500" />}
                                title="总时长"
                                value={formatMinutes(stats.totalPlaytime)}
                                subtitle="累计游戏时长"
                            />
                            <StatCard
                                icon={<TrendingUp className="text-emerald-500" />}
                                title="日均时长"
                                value={formatMinutes(stats.averageDaily)}
                                subtitle="活跃日均值"
                            />
                            <StatCard
                                icon={<Calendar className="text-amber-500" />}
                                title="活跃天数"
                                value={stats.daysActive}
                                subtitle="最近30天"
                            />
                            <StatCard
                                icon={<TrendingUp className="text-purple-500" />}
                                title="最长单日"
                                value={formatMinutes(stats.maxDaily)}
                                subtitle="单日最高时长"
                            />
                        </div>

                        {/* Trend Chart */}
                        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6">
                            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                                时长趋势
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9ca3af"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        style={{ fontSize: '12px' }}
                                        label={{ value: '分钟', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number) => [`${value}分钟`, '每日时长']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="dailyMinutes"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* History Table */}
                        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                            <div className="p-6 border-b border-stone-200 dark:border-stone-800">
                                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                                    每日记录
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-stone-50 dark:bg-stone-800">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
                                                日期
                                            </th>
                                            <th className="text-right px-6 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
                                                当日时长
                                            </th>
                                            <th className="text-right px-6 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
                                                累计时长
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                        {history.slice().reverse().map((record) => (
                                            <tr key={record.date} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                                <td className="px-6 py-3 text-sm text-stone-900 dark:text-stone-100">
                                                    {new Date(record.date).toLocaleDateString('zh-CN')}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {record.dailyDelta && record.dailyDelta > 0 ? (
                                                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                            +{formatMinutes(record.dailyDelta)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-stone-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm text-stone-600 dark:text-stone-400">
                                                    {formatMinutes(record.playtime)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
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
