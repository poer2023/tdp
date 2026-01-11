"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface CustomVideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Custom video player with controls below the video
 * - Play/Pause button and progress bar below video
 * - Volume and fullscreen buttons on the right
 * - No three-dot menu
 */
export function CustomVideoPlayer({ src, poster, className, style }: CustomVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Format time as mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Toggle play/pause
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen();
        }
    }, []);

    // Seek on progress bar click
    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progress = progressRef.current;
        if (!video || !progress) return;

        const rect = progress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * duration;
    }, [duration]);

    // Update time on video timeupdate
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
        };
    }, []);

    // Auto-hide controls after inactivity
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
        }
        if (isPlaying) {
            hideControlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        };
    }, []);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className="flex flex-col"
            onMouseMove={resetHideTimer}
            onMouseEnter={() => setShowControls(true)}
        >
            {/* Video element - no native controls */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                playsInline
                preload="metadata"
                className={className}
                style={style}
                onClick={togglePlay}
            />

            {/* Custom controls below video */}
            <div
                className={`mt-3 flex items-center gap-3 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* Play/Pause button */}
                <button
                    onClick={togglePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label={isPlaying ? "暂停" : "播放"}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Current time */}
                <span className="min-w-[40px] text-xs font-mono text-white/80">
                    {formatTime(currentTime)}
                </span>

                {/* Progress bar */}
                <div
                    ref={progressRef}
                    className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/20"
                    onClick={handleProgressClick}
                >
                    <div
                        className="absolute left-0 top-0 h-full rounded-full bg-white transition-all"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Seek handle */}
                    <div
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow transition-all"
                        style={{ left: `calc(${progress}% - 6px)` }}
                    />
                </div>

                {/* Duration */}
                <span className="min-w-[40px] text-xs font-mono text-white/80">
                    {formatTime(duration)}
                </span>

                {/* Volume button */}
                <button
                    onClick={toggleMute}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={isMuted ? "取消静音" : "静音"}
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Fullscreen button */}
                <button
                    onClick={toggleFullscreen}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="全屏"
                >
                    <Maximize size={18} />
                </button>
            </div>
        </div>
    );
}
