"use client";

import React from "react";
import { Music, Clock } from "lucide-react";

export interface MusicTrack {
    id: string;
    trackName: string;
    artistName: string;
    albumName: string | null;
    artworkUrl: string | null;
    duration: number | null;
    playedAt: Date | string;
}

interface NowPlayingCardProps {
    track: MusicTrack | null;
    recentTracks?: MusicTrack[];
    locale?: string;
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatRelativeTime(dateInput: Date | string, locale: string = "en"): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return locale === "zh" ? "刚刚" : "Just now";
    if (diffMins < 60) return locale === "zh" ? `${diffMins} 分钟前` : `${diffMins}m ago`;
    if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;

    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
    });
}

export function NowPlayingCard({ track, recentTracks = [], locale = "en" }: NowPlayingCardProps) {
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                nowPlaying: "Now Playing",
                recentlyPlayed: "Recently Played",
                noMusicYet: "No music yet",
                listenOnAppleMusic: "Listen on Apple Music",
            },
            zh: {
                nowPlaying: "正在播放",
                recentlyPlayed: "最近播放",
                noMusicYet: "暂无记录",
                listenOnAppleMusic: "在 Apple Music 中收听",
            },
        };
        return translations[locale]?.[key] || key;
    };

    if (!track && recentTracks.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                <div className="mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5 text-rose-500" />
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                        {t("nowPlaying")}
                    </h3>
                </div>
                <div className="flex items-center justify-center py-8 text-stone-400">
                    <p>{t("noMusicYet")}</p>
                </div>
            </div>
        );
    }

    const currentTrack = track || recentTracks[0];
    const historyTracks = track ? recentTracks : recentTracks.slice(1);

    return (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            {/* Current/Latest Track - Hero Section */}
            {currentTrack && (
                <div className="relative overflow-hidden">
                    {/* Background blur from artwork */}
                    {currentTrack.artworkUrl && (
                        <div
                            className="absolute inset-0 scale-150 opacity-30 blur-3xl"
                            style={{
                                backgroundImage: `url(${currentTrack.artworkUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        />
                    )}

                    <div className="relative flex items-center gap-4 p-6">
                        {/* Album Art */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg">
                            {currentTrack.artworkUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentTrack.artworkUrl}
                                    alt={currentTrack.albumName || currentTrack.trackName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Music className="h-8 w-8 text-white/80" />
                                </div>
                            )}
                            {/* Playing indicator */}
                            <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 shadow">
                                <div className="flex gap-0.5">
                                    <span className="h-2 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: "0ms" }} />
                                    <span className="h-3 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: "150ms" }} />
                                    <span className="h-2 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                    {t("nowPlaying")}
                                </span>
                                {currentTrack.duration && (
                                    <span className="flex items-center gap-1 text-xs text-stone-400">
                                        <Clock className="h-3 w-3" />
                                        {formatDuration(currentTrack.duration)}
                                    </span>
                                )}
                            </div>
                            <h4 className="truncate text-lg font-bold text-stone-900 dark:text-stone-100">
                                {currentTrack.trackName}
                            </h4>
                            <p className="truncate text-sm text-stone-500 dark:text-stone-400">
                                {currentTrack.artistName}
                                {currentTrack.albumName && (
                                    <span className="text-stone-400 dark:text-stone-500">
                                        {" "}· {currentTrack.albumName}
                                    </span>
                                )}
                            </p>
                            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                                {formatRelativeTime(currentTrack.playedAt, locale)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Tracks List */}
            {historyTracks.length > 0 && (
                <div className="border-t border-stone-100 dark:border-stone-800">
                    <div className="px-6 py-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                            {t("recentlyPlayed")}
                        </h4>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {historyTracks.slice(0, 5).map((historyTrack) => (
                            <div
                                key={historyTrack.id}
                                className="flex items-center gap-3 px-6 py-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
                            >
                                {/* Small artwork */}
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-700">
                                    {historyTrack.artworkUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={historyTrack.artworkUrl}
                                            alt={historyTrack.albumName || historyTrack.trackName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Music className="h-4 w-4 text-stone-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Track info */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                                        {historyTrack.trackName}
                                    </p>
                                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                                        {historyTrack.artistName}
                                    </p>
                                </div>

                                {/* Time */}
                                <span className="flex-shrink-0 text-xs text-stone-400 dark:text-stone-500">
                                    {formatRelativeTime(historyTrack.playedAt, locale)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NowPlayingCard;
