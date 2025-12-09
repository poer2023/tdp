'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, TrendingUp, Clock, Zap, Calendar } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlaytimeGame {
    gameId: string;
    gameName: string;
    gameCover: string | null;
    appId: string;
    playtime: number;
    dailyDelta: number | null;
}

interface PlaytimeStats {
    totalMinutes: number;
    totalHours: number;
    daysCount: number;
    averagePerDay: number;
}

interface DailyTrend {
    date: string;
    totalMinutes: number;
}

export default function SteamPlaytimePage() {
    const [loading, setLoading] = useState(true);
    const [todayGames, setTodayGames] = useState<PlaytimeGame[]>([]);
    const [weekStats, setWeekStats] = useState<PlaytimeStats | null>(null);
    const [trendData, setTrendData] = useState<DailyTrend[]>([]);
    const [steamId, setSteamId] = useState<string>('');
    const [credentialId, setCredentialId] = useState<string>('');

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchPlaytimeData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch today's summary
            const summaryRes = await fetch(`/api/admin/steam/playtime-history?steamId=${steamId}&type=summary`);
            const summaryData = await summaryRes.json();
            if (summaryData.success) {
                setTodayGames(summaryData.data);
            }

            // Fetch last 7 days stats
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const statsRes = await fetch(
                `/api/admin/steam/playtime-history?steamId=${steamId}&type=total&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );
            const statsData = await statsRes.json();
            if (statsData.success) {
                setWeekStats({
                    totalMinutes: statsData.totalMinutes,
                    totalHours: statsData.totalHours,
                    daysCount: statsData.daysCount,
                    averagePerDay: statsData.averagePerDay,
                });
            }

            // Fetch 30-day trend (aggregated daily total)
            const trend: DailyTrend[] = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0] ?? '';

                const dayRes = await fetch(`/api/admin/steam/playtime-history?steamId=${steamId}&type=summary&date=${date.toISOString()}`);
                const dayData = await dayRes.json();

                if (dayData.success) {
                    const totalMinutes = dayData.data.reduce((sum: number, game: PlaytimeGame) =>
                        sum + (game.dailyDelta || 0), 0
                    );
                    if (totalMinutes > 0 && dateStr) {
                        trend.push({ date: dateStr, totalMinutes });
                    }
                }
            }

            setTrendData(trend.reverse());
        } catch (error) {
            console.error('Failed to fetch playtime data:', error);
        } finally {
            setLoading(false);
        }
    }, [steamId]);

    useEffect(() => {
        if (steamId) {
            fetchPlaytimeData();
        }
    }, [steamId, fetchPlaytimeData]);

    const fetchCredentials = async () => {
        try {
            const response = await fetch('/api/admin/credentials?platform=STEAM');
            const data = await response.json();
            if (data.credentials && data.credentials.length > 0) {
                const steamCred = data.credentials[0];
                setCredentialId(steamCred.id);
                const metadata = steamCred.metadata as { steamId?: string } | null;
                setSteamId(metadata?.steamId || '');
            }
        } catch (error) {
            console.error('Failed to fetch credentials:', error);
        }
    };

    // fetchPlaytimeData moved above useEffect via useCallback

    const handleRefresh = async () => {
        if (!credentialId) {
            alert('No Steam credential found');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/steam/refresh-playtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentialId }),
            });

            const data = await response.json();
            if (data.success) {
                alert(`Successfully refreshed ${data.gamesUpdated} games!`);
                fetchPlaytimeData();
            } else {
                alert(`Refresh failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Refresh error:', error);
            alert('Failed to refresh playtime');
        } finally {
            setLoading(false);
        }
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const chartData = trendData.map(t => ({
        date: new Date(t.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        minutes: t.totalMinutes,
        hours: Math.round(t.totalMinutes / 60 * 10) / 10,
    }));

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">Steam游戏时长</h1>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">追踪每日游戏时长和趋势</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        <Zap size={16} />
                        {loading ? '刷新中...' : '刷新时长'}
                    </button>
                </div>

                {/* Stats Cards */}
                {weekStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Clock className="text-blue-500" />}
                            title="本周总时长"
                            value={`${weekStats.totalHours}h`}
                            subtitle={`${weekStats.totalMinutes} 分钟`}
                        />
                        <StatCard
                            icon={<TrendingUp className="text-emerald-500" />}
                            title="日均时长"
                            value={formatMinutes(weekStats.averagePerDay)}
                            subtitle="最近7天"
                        />
                        <StatCard
                            icon={<Calendar className="text-amber-500" />}
                            title="活跃天数"
                            value={weekStats.daysCount}
                            subtitle="本周玩过游戏"
                        />
                        <StatCard
                            icon={<Gamepad2 className="text-purple-500" />}
                            title="今日游戏"
                            value={todayGames.length}
                            subtitle="已玩游戏数"
                        />
                    </div>
                )}

                {/* 30-Day Trend Chart */}
                {chartData.length > 0 && (
                    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6">
                        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                            最近30天游戏时长趋势
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
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
                                    formatter={(value: number) => [`${value}分钟`, '游戏时长']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="minutes"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Today's Games */}
                <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                    <div className="p-6 border-b border-stone-200 dark:border-stone-800">
                        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">今日游戏</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">今天玩过的游戏和时长增量（点击查看详情）</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-stone-500">加载中...</div>
                    ) : todayGames.length === 0 ? (
                        <div className="p-12 text-center text-stone-500">今天还没有游戏记录</div>
                    ) : (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {todayGames.map((game) => (
                                <Link
                                    key={game.gameId}
                                    href={`/admin/steam-playtime/${game.gameId}`}
                                    className="flex items-start gap-3 p-4 border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:border-blue-500 transition cursor-pointer"
                                >
                                    {game.gameCover && (
                                        <Image
                                            src={game.gameCover}
                                            alt={game.gameName}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded object-cover"
                                            unoptimized
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-stone-900 dark:text-stone-100 truncate">
                                            {game.gameName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm">
                                            <span className="text-stone-600 dark:text-stone-400">
                                                总计: {formatMinutes(game.playtime)}
                                            </span>
                                            {game.dailyDelta && game.dailyDelta > 0 && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                    +{formatMinutes(game.dailyDelta)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
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
