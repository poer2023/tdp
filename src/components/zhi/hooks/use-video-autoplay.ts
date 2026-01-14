import { useEffect, useRef, type RefObject } from 'react';

/**
 * 智能视频自动播放Hook
 * 
 * 功能：
 * - 使用 IntersectionObserver 检测视频是否在视口内
 * - 进入视口自动播放，离开视口自动暂停
 * - 提前50px开始加载（rootMargin），提升用户体验
 * - 视频至少50%可见时才触发播放（threshold: 0.5）
 * 
 * @param videoRef - 视频元素的 ref
 * @returns isInView - 视频是否在视口内
 */
export function useVideoAutoplay(videoRef: RefObject<HTMLVideoElement>): void {
    const isInViewRef = useRef(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // 创建 IntersectionObserver
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;

                const isVisible = entry.isIntersecting;
                isInViewRef.current = isVisible;

                if (isVisible) {
                    // 进入视口：尝试播放
                    video.play().catch(() => {
                        // 自动播放被浏览器策略阻止，静默处理
                        // 常见原因：用户未与页面交互、浏览器设置等
                    });
                } else {
                    // 离开视口：暂停播放
                    video.pause();
                }
            },
            {
                threshold: 0.5, // 视频至少50%可见才触发
                rootMargin: '50px', // 提前50px开始观察（优化加载体验）
            }
        );

        observer.observe(video);

        // 清理函数
        return () => {
            observer.disconnect();
            // 组件卸载时暂停视频
            video.pause();
        };
    }, [videoRef]);

    // Hook is used purely for side effects (auto-play/pause)
}
