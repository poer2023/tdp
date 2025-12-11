"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    HardDrive, Image, Video, File, Trash2, RefreshCw,
    ExternalLink, Search, Grid, List, Cloud, Check, X,
    AlertCircle, Loader2, Settings, Info, Eye, EyeOff, Save
} from 'lucide-react';
import NextImage from 'next/image';
import { useAdminLocale } from './useAdminLocale';

// Types
interface StorageFile {
    key: string;
    size: number;
    lastModified: string;
    url: string;
    thumbnailUrl?: string;
    type: 'image' | 'video' | 'other';
}

interface StorageStats {
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
}

interface StorageData {
    provider: string;
    configured?: boolean;
    accessible?: boolean;
    bucket?: string;
    cdnUrl?: string;
    endpoint?: string;
    region?: string;
    files: StorageFile[];
    stats: StorageStats;
    message?: string;
}

interface StorageConfig {
    storageType: 'local' | 'r2' | 's3';
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    cdnUrl: string;
}

// Toast Component
interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500';
    const Icon = type === 'success' ? Check : type === 'error' ? AlertCircle : Info;

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X size={16} />
            </button>
        </div>
    );
};

// Region options for dropdown
const REGION_OPTIONS = [
    { value: 'auto', label: 'Auto (Recommended for R2)' },
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

export const StorageSection: React.FC = () => {
    const { t } = useAdminLocale();
    const [storageData, setStorageData] = useState<StorageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'other'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Configuration form state
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [config, setConfig] = useState<StorageConfig>({
        storageType: 'local',
        endpoint: '',
        region: 'auto',
        accessKeyId: '',
        secretAccessKey: '',
        bucket: '',
        cdnUrl: '',
    });
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    const fetchStorageData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/storage');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStorageData(data);

            // Update config from fetched data
            if (data.provider) {
                setConfig(prev => ({
                    ...prev,
                    storageType: data.provider as 'local' | 'r2' | 's3',
                    bucket: data.bucket || '',
                    cdnUrl: data.cdnUrl || '',
                    endpoint: data.endpoint || '',
                    region: data.region || 'auto',
                }));
            }
        } catch (error) {
            console.error('Failed to fetch storage data:', error);
            showToast('Failed to load storage data', 'error');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchStorageData();
    }, [fetchStorageData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchStorageData();
    };

    const handleTestConnection = async () => {
        if (config.storageType === 'local') {
            showToast(t('localStorageMode'), 'info');
            return;
        }

        if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setIsTesting(true);
        try {
            const res = await fetch('/api/admin/storage/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('connectionSuccess'), 'success');
            } else {
                showToast(data.error || t('connectionFailed'), 'error');
            }
        } catch {
            showToast(t('connectionFailed'), 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/storage/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();
            if (res.ok) {
                showToast(t('configSaved'), 'success');
                setShowConfigForm(false);
                fetchStorageData();
            } else {
                showToast(data.error || t('configSaveFailed'), 'error');
            }
        } catch {
            showToast(t('configSaveFailed'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm(t('confirmDeleteFile'))) return;

        setDeletingKey(key);
        try {
            const res = await fetch(`/api/admin/storage/${encodeURIComponent(key)}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            showToast('File deleted successfully', 'success');
            fetchStorageData();
        } catch (error) {
            console.error('Failed to delete file:', error);
            showToast('Failed to delete file', 'error');
        } finally {
            setDeletingKey(null);
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image size={16} className="text-purple-500" />;
            case 'video': return <Video size={16} className="text-blue-500" />;
            default: return <File size={16} className="text-stone-400" />;
        }
    };

    // Filter files
    const filteredFiles = storageData?.files.filter(file => {
        const matchesSearch = file.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || file.type === typeFilter;
        return matchesSearch && matchesType;
    }) || [];

    const getStorageTypeLabel = (provider: string) => {
        switch (provider) {
            case 'r2': return t('r2StorageMode');
            case 's3': return t('s3StorageMode');
            default: return t('localStorageMode');
        }
    };

    const getStorageTypeIcon = (provider: string) => {
        switch (provider) {
            case 'r2':
            case 's3':
                return <Cloud size={20} className="text-orange-500" />;
            default:
                return <HardDrive size={20} className="text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('storage')}</h2>
                    <p className="text-sm text-stone-500 mt-1">{t('storageDescription')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowConfigForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                    >
                        <Settings size={16} />
                        {t('storageConfig')}
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {t('refresh')}
                    </button>
                </div>
            </div>

            {/* Configuration Modal */}
            {showConfigForm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowConfigForm(false)} />
                    <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
                            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                <Settings size={20} />
                                {t('storageConfig')}
                            </h3>
                            <button
                                onClick={() => setShowConfigForm(false)}
                                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-stone-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Storage Type Selector */}
                            <div>
                                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-3">
                                    {t('storageType')}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'local', label: t('localStorageMode'), icon: HardDrive, color: 'blue' },
                                        { value: 'r2', label: t('r2StorageMode'), icon: Cloud, color: 'orange' },
                                        { value: 's3', label: t('s3StorageMode'), icon: Cloud, color: 'purple' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setConfig({ ...config, storageType: option.value as StorageConfig['storageType'] })}
                                            className={`p-4 rounded-xl border-2 transition-all ${config.storageType === option.value
                                                ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                                                : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                                }`}
                                        >
                                            <option.icon
                                                size={24}
                                                className={`mx-auto mb-2 ${config.storageType === option.value
                                                    ? `text-${option.color}-500`
                                                    : 'text-stone-400'
                                                    }`}
                                            />
                                            <div className={`text-xs font-medium ${config.storageType === option.value
                                                ? 'text-stone-900 dark:text-stone-100'
                                                : 'text-stone-500'
                                                }`}>
                                                {option.label}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* R2/S3 Configuration Fields */}
                            {config.storageType !== 'local' && (
                                <div className="space-y-4 pt-2">
                                    {/* Endpoint */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            S3 Endpoint <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={config.endpoint}
                                            onChange={(e) => {
                                                let value = e.target.value.trim();

                                                // Auto-parse: if URL contains path after domain, extract it as bucket
                                                // e.g., https://xxx.r2.cloudflarestorage.com/blog-media -> extract "blog-media"
                                                try {
                                                    if (value && (value.includes('cloudflarestorage.com/') || value.includes('amazonaws.com/'))) {
                                                        const url = new URL(value);
                                                        const pathParts = url.pathname.split('/').filter(Boolean);
                                                        if (pathParts.length > 0) {
                                                            const extractedBucket = pathParts[0];
                                                            // Remove the path from endpoint
                                                            const cleanEndpoint = `${url.protocol}//${url.host}`;
                                                            setConfig({
                                                                ...config,
                                                                endpoint: cleanEndpoint,
                                                                bucket: extractedBucket || config.bucket || ''
                                                            });
                                                            return;
                                                        }
                                                    }
                                                } catch {
                                                    // Not a valid URL yet, continue
                                                }

                                                setConfig({ ...config, endpoint: value });
                                            }}
                                            placeholder={config.storageType === 'r2'
                                                ? 'https://<account-id>.r2.cloudflarestorage.com'
                                                : 'https://s3.amazonaws.com'}
                                            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                        />
                                        {config.storageType === 'r2' && (
                                            <p className="text-xs text-stone-400 mt-1.5">
                                                📍 直接粘贴 R2 控制台的 S3 API URL（自动提取 Bucket 名称）
                                            </p>
                                        )}
                                    </div>

                                    {/* Region */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            {t('s3Region')}
                                        </label>
                                        <select
                                            value={config.region}
                                            onChange={(e) => setConfig({ ...config, region: e.target.value })}
                                            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                        >
                                            {REGION_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Bucket Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            存储桶名称 <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={config.bucket}
                                            onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                                            placeholder="my-media-bucket"
                                            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                        />
                                    </div>

                                    {/* Access Key ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            访问密钥 ID <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={config.accessKeyId}
                                            onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                                            placeholder="R2 或 S3 Access Key ID"
                                            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm font-mono outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                        />
                                    </div>

                                    {/* Secret Access Key */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            访问密钥 <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecretKey ? 'text' : 'password'}
                                                value={config.secretAccessKey}
                                                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                                                placeholder="R2 或 S3 Secret Access Key"
                                                className="w-full p-3 pr-10 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm font-mono outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecretKey(!showSecretKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                            >
                                                {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* CDN URL (Optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                                            CDN URL（可选）
                                        </label>
                                        <input
                                            type="url"
                                            value={config.cdnUrl}
                                            onChange={(e) => setConfig({ ...config, cdnUrl: e.target.value })}
                                            placeholder="https://pub-xxx.r2.dev 或自定义域名"
                                            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500"
                                        />
                                        <p className="text-xs text-stone-400 mt-1.5">
                                            💡 R2 Public Access 或自定义 CDN 域名，用于图片访问
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Local Storage Info */}
                            {config.storageType === 'local' && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-3">
                                        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-800 dark:text-blue-200">
                                            <p className="font-medium mb-1">本地存储模式</p>
                                            <p className="text-blue-600 dark:text-blue-300">
                                                文件将存储在服务器本地文件系统中。适用于开发环境，生产环境建议使用 Cloudflare R2。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting || config.storageType === 'local'}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors disabled:opacity-50"
                            >
                                {isTesting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Cloud size={16} />
                                )}
                                {t('testConnection')}
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfigForm(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {t('saveConfig')}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Configuration Status Card */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {getStorageTypeIcon(storageData?.provider || 'local')}
                        <div>
                            <h3 className="font-bold text-stone-800 dark:text-stone-100">{t('currentConfig')}</h3>
                            <p className="text-sm text-stone-500">{getStorageTypeLabel(storageData?.provider || 'local')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {storageData?.configured ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-sm font-medium rounded-full">
                                <Check size={14} />
                                {t('configuredCorrectly')}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 text-sm font-medium rounded-full">
                                <AlertCircle size={14} />
                                {t('notConfigured')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Config Details */}
                {storageData?.provider !== 'local' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                        {storageData?.bucket && (
                            <div>
                                <div className="text-xs text-stone-500 uppercase font-bold mb-1">{t('s3Bucket')}</div>
                                <div className="text-sm font-medium text-stone-800 dark:text-stone-200">{storageData.bucket}</div>
                            </div>
                        )}
                        {storageData?.region && (
                            <div>
                                <div className="text-xs text-stone-500 uppercase font-bold mb-1">{t('s3Region')}</div>
                                <div className="text-sm font-medium text-stone-800 dark:text-stone-200">{storageData.region}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Access</div>
                            <div className={`text-sm font-medium ${storageData?.accessible ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {storageData?.accessible ? t('accessible') : t('notAccessible')}
                            </div>
                        </div>
                        {storageData?.cdnUrl && (
                            <div>
                                <div className="text-xs text-stone-500 uppercase font-bold mb-1">CDN</div>
                                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                                    <Check size={12} />
                                    已配置
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <HardDrive size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 uppercase font-bold">{t('filesInStorage')}</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {storageData?.stats.totalFiles || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">
                            <Cloud size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 uppercase font-bold">{t('totalStorage')}</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {formatSize(storageData?.stats.totalSize || 0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                            <Image size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 uppercase font-bold">{t('imageFiles')}</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {storageData?.stats.byType?.image || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
                            <Video size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 uppercase font-bold">{t('videoFiles')}</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {storageData?.stats.byType?.video || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Browser */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                {/* Browser Header */}
                <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                            <File size={18} />
                            {t('fileBrowser')}
                        </h3>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:flex-initial">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder={t('searchFiles')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-64 pl-9 pr-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none focus:ring-2 focus:ring-sage-500/20"
                                />
                            </div>

                            {/* Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                                className="px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm outline-none"
                            >
                                <option value="all">{t('allFiles')}</option>
                                <option value="image">{t('imageFiles')}</option>
                                <option value="video">{t('videoFiles')}</option>
                                <option value="other">{t('otherFiles')}</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex border rounded-lg overflow-hidden border-stone-200 dark:border-stone-700">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-stone-200 dark:bg-stone-700' : 'bg-stone-50 dark:bg-stone-800'} text-stone-600 dark:text-stone-300`}
                                    title={t('gridView')}
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-stone-200 dark:bg-stone-700' : 'bg-stone-50 dark:bg-stone-800'} text-stone-600 dark:text-stone-300`}
                                    title={t('listView')}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Files Grid/List */}
                <div className="p-4">
                    {storageData?.provider === 'local' ? (
                        <div className="text-center py-12">
                            <HardDrive size={48} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                            <p className="text-stone-500">{t('localStorageMode')}</p>
                            <p className="text-sm text-stone-400 mt-1">{t('configureStorageHint')}</p>
                            <button
                                onClick={() => setShowConfigForm(true)}
                                className="mt-4 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                {t('storageConfig')}
                            </button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-12">
                            <File size={48} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                            <p className="text-stone-500">{t('noFilesFound')}</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.key}
                                    className="group relative bg-stone-50 dark:bg-stone-800 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
                                >
                                    {/* Preview */}
                                    <div className="aspect-square relative bg-stone-100 dark:bg-stone-800">
                                        {file.type === 'image' ? (
                                            <NextImage
                                                src={file.thumbnailUrl || file.url}
                                                alt={file.key}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                        ) : file.type === 'video' ? (
                                            <video
                                                src={file.url}
                                                className="w-full h-full object-cover"
                                                muted
                                                onMouseEnter={(e) => e.currentTarget.play()}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.pause();
                                                    e.currentTarget.currentTime = 0;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <File size={32} className="text-stone-400" />
                                            </div>
                                        )}

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(file.key)}
                                                disabled={deletingKey === file.key}
                                                className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-lg text-white transition-colors disabled:opacity-50"
                                            >
                                                {deletingKey === file.key ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2">
                                        <div className="flex items-center gap-1.5">
                                            {getFileIcon(file.type)}
                                            <span className="text-xs text-stone-600 dark:text-stone-400 truncate flex-1">
                                                {file.key.split('/').pop()}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-stone-400 mt-1">
                                            {formatSize(file.size)} • {formatDate(file.lastModified)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.key}
                                    className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-700">
                                        {file.type === 'image' ? (
                                            <NextImage
                                                src={file.url}
                                                alt={file.key}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {getFileIcon(file.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                                            {file.key}
                                        </div>
                                        <div className="text-xs text-stone-400 flex items-center gap-2">
                                            <span>{formatSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(file.lastModified)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-lg transition-colors"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file.key)}
                                            disabled={deletingKey === file.key}
                                            className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {deletingKey === file.key ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StorageSection;
