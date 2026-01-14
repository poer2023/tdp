"use client";

/* eslint-disable no-console */

/**
 * 视频调试日志工具
 * 用于追踪视频上传、处理和显示的完整数据流
 */

type LogLevel = 'start' | 'step' | 'data' | 'success' | 'warn' | 'error' | 'end';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    operation: string;
    stepName: string;
    data?: any;
    message?: string;
}

class VideoDebugLogger {
    private logs: LogEntry[] = [];
    private enabled: boolean;
    private currentOperation: string | null = null;

    constructor() {
        // 开发环境默认启用，生产环境可通过 localStorage 控制
        this.enabled = process.env.NODE_ENV === 'development' ||
            (typeof window !== 'undefined' && window.localStorage?.getItem('VIDEO_DEBUG') === 'true');
    }

    /**
     * 开启调试模式（浏览器 console 执行）
     */
    enable() {
        if (typeof window !== 'undefined') {
            window.localStorage?.setItem('VIDEO_DEBUG', 'true');
            this.enabled = true;
            console.log('📹 视频调试模式已启用 - 请刷新页面或重新上传视频以查看日志');
        }
    }

    /**
     * 关闭调试模式
     */
    disable() {
        if (typeof window !== 'undefined') {
            window.localStorage?.removeItem('VIDEO_DEBUG');
            this.enabled = false;
            console.log('📹 视频调试模式已关闭');
        }
    }

    private log(level: LogLevel, stepName: string, data?: any, message?: string) {
        if (!this.enabled) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            operation: this.currentOperation || 'unknown',
            stepName,
            data,
            message,
        };

        this.logs.push(entry);

        // Console 输出
        const emoji = {
            start: '🎬',
            step: '▶️',
            data: '📦',
            success: '✅',
            warn: '⚠️',
            error: '❌',
            end: '🏁',
        };

        const color = {
            start: 'color: #3b82f6; font-weight: bold',
            step: 'color: #6b7280',
            data: 'color: #8b5cf6',
            success: 'color: #10b981',
            warn: 'color: #f59e0b',
            error: 'color: #ef4444; font-weight: bold',
            end: 'color: #3b82f6; font-weight: bold',
        };

        const prefix = `${emoji[level]} [视频调试] ${this.currentOperation || ''} > ${stepName}`;

        if (data) {
            console.groupCollapsed(`%c${prefix}`, color[level]);
            console.log('时间:', entry.timestamp);
            if (message) console.log('信息:', message);
            console.log('数据:', data);
            console.groupEnd();
        } else {
            console.log(`%c${prefix}${message ? ': ' + message : ''}`, color[level]);
        }
    }

    /**
     * 开始一个操作（如 video-upload, video-display）
     */
    start(operation: string, data?: any) {
        this.currentOperation = operation;
        this.log('start', '开始', data, `操作: ${operation}`);
    }

    /**
     * 记录操作步骤
     */
    step(stepName: string, data?: any) {
        this.log('step', stepName, data);
    }

    /**
     * 记录数据快照（重要的中间数据）
     */
    data(label: string, data: any) {
        this.log('data', label, data);
    }

    /**
     * 记录成功信息
     */
    success(stepName: string, data?: any) {
        this.log('success', stepName, data);
    }

    /**
     * 记录警告
     */
    warn(stepName: string, dataOrMessage?: any) {
        const isString = typeof dataOrMessage === 'string';
        this.log('warn', stepName, isString ? undefined : dataOrMessage, isString ? dataOrMessage : undefined);
    }

    /**
     * 记录错误
     */
    error(stepName: string, error: any) {
        const errorData = error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error;
        this.log('error', stepName, errorData);
    }

    /**
     * 结束操作
     */
    end(operation: string, result?: any) {
        this.log('end', '完成', result, `操作: ${operation}`);
        this.currentOperation = null;
    }

    /**
     * 获取所有日志（用于导出或调试）
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * 导出日志为 JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * 清空日志
     */
    clear() {
        this.logs = [];
        console.clear();
        console.log('📹 视频调试日志已清空');
    }

    /**
     * 打印日志摘要
     */
    summary() {
        if (!this.enabled) {
            console.log('📹 视频调试模式未启用。运行 videoLogger.enable() 启用。');
            return;
        }

        const operations = new Set(this.logs.map(log => log.operation));
        const errors = this.logs.filter(log => log.level === 'error');
        const warnings = this.logs.filter(log => log.level === 'warn');

        console.group('📹 视频调试日志摘要');
        console.log('总日志数:', this.logs.length);
        console.log('操作类型:', Array.from(operations).join(', '));
        console.log('错误数:', errors.length);
        console.log('警告数:', warnings.length);

        if (errors.length > 0) {
            console.group('❌ 错误详情');
            errors.forEach(err => {
                console.log(`${err.stepName}:`, err.data);
            });
            console.groupEnd();
        }

        if (warnings.length > 0) {
            console.group('⚠️ 警告详情');
            warnings.forEach(warn => {
                console.log(`${warn.stepName}:`, warn.data || warn.message);
            });
            console.groupEnd();
        }

        console.groupEnd();
    }
}

// 单例导出
export const videoLogger = new VideoDebugLogger();

// 浏览器全局访问（方便调试）
if (typeof window !== 'undefined') {
    (window as any).videoLogger = videoLogger;
    console.log('💡 视频调试工具已加载 - 使用 videoLogger.summary() 查看日志摘要，videoLogger.disable() 关闭调试');
}
