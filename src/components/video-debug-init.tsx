"use client";

import { useEffect } from "react";
import { videoLogger as _videoLogger } from "@/lib/video-debug-logger";

/**
 * 视频调试工具初始化组件
 * 确保 videoLogger 在客户端环境中被加载
 */
export function VideoDebugInit() {
    useEffect(() => {
        // 在客户端挂载时，videoLogger 已经通过模块导入加载到全局
        // 这个组件的作用是确保模块被执行
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.info('📹 视频调试工具已初始化');
        }
    }, []);

    return null;
}
