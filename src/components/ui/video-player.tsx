"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Volume2, VolumeX, Maximize, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    className?: string;
    aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
    width?: number;
    height?: number;
    playOnHover?: boolean; // Play when hovering
    showPlayButton?: boolean; // Show play button overlay
    onClick?: () => void;
}

/**
 * VideoPlayer component for displaying videos with optional controls
 * Supports autoplay, muted, loop, and hover-to-play functionality
 */
export function VideoPlayer({
    src,
    poster,
    autoPlay = false,
    muted = true,
    loop = true,
    controls = false,
    className,
    aspectRatio,
    width,
    height,
    playOnHover = false,
    showPlayButton = true,
    onClick,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(muted);
    const [showControls, setShowControls] = useState(false);
    const [hasStarted, setHasStarted] = useState(autoPlay);

    // Handle video play/pause
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
            setHasStarted(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, []);

    // Handle mute toggle
    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    // Handle fullscreen
    const enterFullscreen = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.requestFullscreen) {
            video.requestFullscreen();
        }
    }, []);

    // Handle hover play
    const handleMouseEnter = useCallback(() => {
        if (playOnHover && videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
            setHasStarted(true);
        }
        setShowControls(true);
    }, [playOnHover]);

    const handleMouseLeave = useCallback(() => {
        if (playOnHover && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        setShowControls(false);
    }, [playOnHover]);

    // Handle click
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (onClick) {
                onClick();
            } else if (!controls) {
                togglePlay();
            }
        },
        [onClick, controls, togglePlay]
    );

    // Sync state with video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
        };
    }, []);

    // Calculate style
    const containerStyle: React.CSSProperties = {
        aspectRatio: aspectRatio,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-stone-900",
                className
            )}
            style={containerStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* Video element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                controls={controls}
                className="h-full w-full object-cover"
            />

            {/* Play button overlay (when not playing and not autoPlay) */}
            {showPlayButton && !hasStarted && !autoPlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-transform hover:scale-110"
                    >
                        <Play size={28} className="ml-1" />
                    </button>
                </div>
            )}

            {/* Poster overlay while loading (if provided and not started) */}
            {poster && !hasStarted && (
                <div className="absolute inset-0 pointer-events-none transition-opacity duration-300">
                    <Image
                        src={poster}
                        alt="Video poster"
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Custom controls overlay */}
            {!controls && showControls && hasStarted && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            enterFullscreen();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    >
                        <Maximize size={16} />
                    </button>
                </div>
            )}

            {/* Duration badge (for moment cards) */}
            {!controls && !showControls && hasStarted && (
                <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {isPlaying ? "▶" : "⏸"}
                </div>
            )}
        </div>
    );
}

/**
 * Simplified video component for hero/background videos
 * Always muted, autoplays, loops, no controls
 */
export function HeroVideo({
    src,
    poster,
    className,
}: {
    src: string;
    poster?: string;
    className?: string;
}) {
    return (
        <video
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            className={cn("h-full w-full object-cover", className)}
        />
    );
}

export default VideoPlayer;
