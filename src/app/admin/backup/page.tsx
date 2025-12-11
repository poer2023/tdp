"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Database,
    Image as ImageIcon,
    Download,
    Trash2,
    RefreshCw,
    Plus,
    HardDrive,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Archive,
    Upload,
    RotateCcw
} from 'lucide-react';

interface BackupInfo {
    id: string;
    filename: string;
    size: number;
    createdAt: string;
    manifest?: {
        version: string;
        database: { tables: string[]; totalRecords: number };
        media: { totalFiles: number; totalSize: number };
    };
}

interface BackupStats {
    database: { tables: number; totalRecords: number };
    media: { totalFiles: number; totalSize: number };
}

interface RestorePreview {
    manifest: {
        version: string;
        createdAt: string;
    };
    database: { tables: string[]; totalRecords: number };
    media: { totalFiles: number; totalSize: number };
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [stats, setStats] = useState<BackupStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [includeMedia, setIncludeMedia] = useState(true);

    // Restore state
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [restoreDatabase, setRestoreDatabase] = useState(true);
    const [restoreMediaFiles, setRestoreMediaFiles] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchBackups = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/backup');
            if (!res.ok) throw new Error('Failed to fetch backups');
            const data = await res.json();
            setBackups(data.backups || []);
            setStats(data.stats || null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch backups');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            setError(null);
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ includeMedia }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create backup');
            }

            await fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = (id: string) => {
        window.open(`/api/admin/backup/${id}`, '_blank');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个备份吗？')) return;

        try {
            setDeleting(id);
            const res = await fetch(`/api/admin/backup/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete backup');
            await fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setRestoreFile(file);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/backup/restore?preview=true', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Invalid backup file');
            }

            const data = await res.json();
            setRestorePreview(data.preview);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse backup');
            setRestoreFile(null);
            setRestorePreview(null);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile || !restorePreview) return;
        if (!confirm('确定要恢复此备份吗？这将覆盖现有数据！')) return;

        try {
            setRestoring(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', restoreFile);
            formData.append('restoreDatabase', String(restoreDatabase));
            formData.append('restoreMedia', String(restoreMediaFiles));

            const res = await fetch('/api/admin/backup/restore', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Restore failed');
            }

            alert('恢复成功！数据库：' + data.result.database.recordsRestored + ' 条记录，媒体：' + data.result.media.filesRestored + ' 个文件');

            setRestoreFile(null);
            setRestorePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            await fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Restore failed');
        } finally {
            setRestoring(false);
        }
    };

    const cancelRestore = () => {
        setRestoreFile(null);
        setRestorePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        站点备份
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 mt-1">
                        备份和恢复数据库与媒体资源
                    </p>
                </div>
                <button
                    onClick={fetchBackups}
                    disabled={loading}
                    className="p-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">数据库</span>
                        </div>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {stats.database.totalRecords.toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{stats.database.tables} 个数据表</p>
                    </div>

                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">媒体资源</span>
                        </div>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {stats.media.totalFiles.toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{formatBytes(stats.media.totalSize)}</p>
                    </div>

                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Archive className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">备份数</span>
                        </div>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {backups.length}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                            {backups.length > 0 && backups[0]
                                ? '最新: ' + formatDate(backups[0].createdAt)
                                : '暂无备份'}
                        </p>
                    </div>
                </div>
            )}

            {/* Create Backup Section */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                    创建新备份
                </h2>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeMedia}
                            onChange={(e) => setIncludeMedia(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
                        />
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                            包含媒体文件（图片等）
                        </span>
                    </label>

                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                备份中...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                立即备份
                            </>
                        )}
                    </button>
                </div>

                {creating && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">正在创建备份，请稍候...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Restore Section */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                    恢复备份
                </h2>

                {!restorePreview ? (
                    <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-8 text-center">
                        <Upload className="w-10 h-10 mx-auto text-stone-400 mb-3" />
                        <p className="text-stone-600 dark:text-stone-400 mb-3">选择备份文件上传</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="restore-file"
                        />
                        <label
                            htmlFor="restore-file"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            选择文件
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-stone-900 dark:text-stone-100">
                                    {restoreFile?.name}
                                </span>
                                <button
                                    onClick={cancelRestore}
                                    className="text-sm text-stone-500 hover:text-stone-700"
                                >
                                    取消
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-stone-500">备份时间：</span>
                                    <span className="text-stone-900 dark:text-stone-100 ml-1">
                                        {formatDate(restorePreview.manifest.createdAt)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-stone-500">版本：</span>
                                    <span className="text-stone-900 dark:text-stone-100 ml-1">
                                        {restorePreview.manifest.version}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-stone-500">数据库：</span>
                                    <span className="text-stone-900 dark:text-stone-100 ml-1">
                                        {restorePreview.database.totalRecords} 条记录
                                    </span>
                                </div>
                                <div>
                                    <span className="text-stone-500">媒体：</span>
                                    <span className="text-stone-900 dark:text-stone-100 ml-1">
                                        {restorePreview.media.totalFiles} 个文件
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={restoreDatabase}
                                    onChange={(e) => setRestoreDatabase(e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
                                />
                                <span className="text-sm text-stone-600 dark:text-stone-400">恢复数据库</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={restoreMediaFiles}
                                    onChange={(e) => setRestoreMediaFiles(e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
                                />
                                <span className="text-sm text-stone-600 dark:text-stone-400">恢复媒体文件</span>
                            </label>
                        </div>

                        <button
                            onClick={handleRestore}
                            disabled={restoring || (!restoreDatabase && !restoreMediaFiles)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {restoring ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    恢复中...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="w-4 h-4" />
                                    开始恢复
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Backup History */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        备份历史
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
                        <p className="text-sm text-stone-500 mt-2">加载中...</p>
                    </div>
                ) : backups.length === 0 ? (
                    <div className="p-8 text-center">
                        <HardDrive className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                        <p className="text-stone-500 dark:text-stone-400">暂无备份</p>
                        <p className="text-sm text-stone-400 mt-1">点击上方按钮创建第一个备份</p>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {backups.map((backup) => (
                            <div
                                key={backup.id}
                                className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            {backup.filename}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(backup.createdAt)}
                                            </span>
                                            <span>{formatBytes(backup.size)}</span>
                                            {backup.manifest && (
                                                <>
                                                    <span>{backup.manifest.database.totalRecords} 条记录</span>
                                                    <span>{backup.manifest.media.totalFiles} 个文件</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownload(backup.id)}
                                        className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="下载"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(backup.id)}
                                        disabled={deleting === backup.id}
                                        className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="删除"
                                    >
                                        {deleting === backup.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
