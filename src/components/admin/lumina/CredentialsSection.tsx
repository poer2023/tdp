"use client";

import React, { useState, useCallback } from 'react';
import { Key, RefreshCw, Edit2, Trash2, Check, X, AlertCircle, Shield, Loader2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useData } from './store';
import type { Credential, SyncJob } from './types';
import {
    ListContainer, EditForm, Input, ActionBtn
} from './AdminComponents';
import { useAdminLocale } from './useAdminLocale';

// Toast notification component
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
    const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : AlertCircle;

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

export const CredentialsSection: React.FC = () => {
    const { credentials, addCredential, updateCredential, deleteCredential, triggerSync, syncJobs, loading } = useData();
    const { t } = useAdminLocale();
    const [editingCredential, setEditingCredential] = useState<Partial<Credential> | null>(null);
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
    const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    const handleSaveCredential = async () => {
        if (!editingCredential?.platform || !editingCredential?.identifier) {
            showToast('Platform and credential value are required', 'error');
            return;
        }
        const credData = {
            ...editingCredential,
            id: editingCredential.id || Math.random().toString(36).substr(2, 9),
            name: editingCredential.name || editingCredential.platform,
            status: editingCredential.status || 'active',
            type: editingCredential.type || 'token',
            identifier: editingCredential.identifier?.trim(),
            failureCount: editingCredential.failureCount || 0
        } as Credential;

        try {
            if (editingCredential.id) {
                updateCredential(credData);
                showToast('Credential updated successfully', 'success');
            } else {
                addCredential(credData);
                showToast('Credential created successfully', 'success');
            }
            setEditingCredential(null);
        } catch {
            showToast('Failed to save credential', 'error');
        }
    };

    const handleTriggerSync = async (id: string, platform: string) => {
        setSyncingIds(prev => new Set(prev).add(id));
        showToast(`Starting sync for ${platform}...`, 'info');

        try {
            await triggerSync(id);
            // Check sync result from syncJobs
            const latestJob = syncJobs.find(j => j.credentialId === id);
            if (latestJob?.status === 'success') {
                showToast(`${platform} synced successfully!`, 'success');
            } else if (latestJob?.status === 'failed') {
                showToast(`${platform} sync failed`, 'error');
            } else {
                showToast(`${platform} sync completed`, 'success');
            }
        } catch {
            showToast(`Failed to sync ${platform}`, 'error');
        } finally {
            setSyncingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleValidate = async (id: string, platform: string) => {
        setValidatingIds(prev => new Set(prev).add(id));
        showToast(`Validating ${platform} credential...`, 'info');

        try {
            const res = await fetch(`/api/admin/credentials/${id}/validate`, { method: 'POST' });
            const data = await res.json();

            if (res.ok && data.validation?.isValid) {
                showToast(`${platform} credential is valid!`, 'success');
                // Refresh credentials list to get updated status
                handleRefresh();
            } else {
                showToast(data.validation?.error || `${platform} credential validation failed`, 'error');
            }
        } catch {
            showToast(`Failed to validate ${platform}`, 'error');
        } finally {
            setValidatingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/admin/credentials', { cache: 'no-store' });
            if (res.ok) {
                showToast('Credentials refreshed', 'success');
                // The store will auto-refresh via useData hook
                window.location.reload();
            }
        } catch {
            showToast('Failed to refresh credentials', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (id: string, platform: string) => {
        if (!confirm(`Are you sure you want to delete the ${platform} credential?`)) return;

        try {
            deleteCredential(id);
            showToast(`${platform} credential deleted`, 'success');
        } catch {
            showToast('Failed to delete credential', 'error');
        }
    };

    const formatLastSync = (dateStr?: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    // Get recent sync job for a credential
    const getLatestSyncJob = (credId: string): SyncJob | undefined => {
        return syncJobs.find(j => j.credentialId === credId);
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Credentials & Sync</h2>
                    <p className="text-sm text-stone-500 mt-1">Manage API credentials and synchronize data from external platforms</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                        title="Refresh credentials list"
                    >
                        <RotateCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setEditingCredential({})}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                    >
                        <Key size={16} />
                        Add Credential
                    </button>
                </div>
            </div>

            {/* Edit Form */}
            {editingCredential ? (
                <EditForm title={editingCredential.id ? 'Edit Credential' : 'New Credential'} onSave={handleSaveCredential} onCancel={() => setEditingCredential(null)}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Platform *</label>
                            <select
                                value={editingCredential.platform || ''}
                                onChange={e => setEditingCredential({ ...editingCredential, platform: e.target.value as Credential['platform'] })}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                            >
                                <option value="">Select Platform</option>
                                <option value="Steam">Steam</option>
                                <option value="Bilibili">Bilibili</option>
                                <option value="Douban">Douban</option>
                                <option value="GitHub">GitHub</option>
                                <option value="Spotify">Spotify</option>
                                <option value="Nintendo">Nintendo</option>
                                <option value="Hoyoverse">Hoyoverse</option>
                                <option value="Jellyfin">Jellyfin</option>
                            </select>
                        </div>
                        <Input label="Display Name" value={editingCredential.name || ''} onChange={v => setEditingCredential({ ...editingCredential, name: v })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Credential Value (Cookie/Token/API Key) *</label>
                        <textarea
                            value={editingCredential.identifier || ''}
                            onChange={e => setEditingCredential({ ...editingCredential, identifier: e.target.value })}
                            className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-sm min-h-[100px]"
                            placeholder="Paste your cookie, token, or API key here..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Type</label>
                            <select
                                value={editingCredential.type || 'token'}
                                onChange={e => setEditingCredential({ ...editingCredential, type: e.target.value as Credential['type'] })}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                            >
                                <option value="token">Token</option>
                                <option value="cookie">Cookie</option>
                                <option value="api_key">API Key</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            <div className={`w-3 h-3 rounded-full ${editingCredential.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                            <span className="text-sm capitalize text-stone-600 dark:text-stone-400">{editingCredential.status || 'active'}</span>
                        </div>
                    </div>
                </EditForm>
            ) : (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Total Credentials</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{credentials.length}</div>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Active</div>
                            <div className="text-2xl font-bold text-emerald-600">{credentials.filter(c => c.status === 'active').length}</div>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Needs Attention</div>
                            <div className="text-2xl font-bold text-rose-600">{credentials.filter(c => c.status === 'error').length}</div>
                        </div>
                    </div>

                    {/* Credentials List */}
                    {loading.credentials ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-stone-400" />
                        </div>
                    ) : credentials.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                            <Key size={48} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                            <p className="text-stone-500">No credentials configured</p>
                            <p className="text-sm text-stone-400 mt-1">Add a credential to start syncing data</p>
                        </div>
                    ) : (
                        <ListContainer>
                            {credentials.map(c => {
                                const isSyncing = syncingIds.has(c.id);
                                const isValidating = validatingIds.has(c.id);
                                const latestJob = getLatestSyncJob(c.id);

                                return (
                                    <div key={c.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${c.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}`}>
                                                    <Key size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                                        {c.platform}
                                                        <span className="text-xs font-normal text-stone-400 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">{c.name}</span>
                                                        {c.status === 'error' && (
                                                            <span className="text-xs font-medium text-rose-600 px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 rounded flex items-center gap-1">
                                                                <AlertCircle size={12} />
                                                                Invalid
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-stone-500 font-mono mt-1 max-w-xs truncate">{c.identifier}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-xs">
                                                    <div className={c.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}>
                                                        {c.status === 'active' ? (
                                                            <span className="flex items-center gap-1 justify-end"><Check size={12} /> Valid</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 justify-end"><X size={12} /> Invalid</span>
                                                        )}
                                                    </div>
                                                    <div className="text-stone-400">Synced: {formatLastSync(c.lastSync)}</div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-1">
                                                    {/* Validate Button */}
                                                    <button
                                                        onClick={() => handleValidate(c.id, c.platform)}
                                                        disabled={isValidating}
                                                        className="p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-blue-600 transition-colors disabled:opacity-50"
                                                        title="Validate Credential"
                                                    >
                                                        {isValidating ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Shield size={16} />
                                                        )}
                                                    </button>

                                                    {/* Sync Button */}
                                                    <button
                                                        onClick={() => handleTriggerSync(c.id, c.platform)}
                                                        disabled={isSyncing || c.status === 'error'}
                                                        className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition-colors disabled:opacity-50"
                                                        title={c.status === 'error' ? 'Validate credential first' : 'Trigger Sync'}
                                                    >
                                                        {isSyncing ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <RefreshCw size={16} />
                                                        )}
                                                    </button>

                                                    <ActionBtn onClick={() => setEditingCredential(c)} icon={<Edit2 size={16} />} />
                                                    <ActionBtn onClick={() => handleDelete(c.id, c.platform)} icon={<Trash2 size={16} />} danger />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sync Status Bar */}
                                        {(isSyncing || latestJob) && (
                                            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                                                {isSyncing ? (
                                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Syncing data...</span>
                                                    </div>
                                                ) : latestJob && (
                                                    <div className={`flex items-center gap-2 text-sm ${latestJob.status === 'success' ? 'text-emerald-600' : latestJob.status === 'failed' ? 'text-rose-600' : 'text-stone-500'}`}>
                                                        {latestJob.status === 'success' ? (
                                                            <CheckCircle2 size={14} />
                                                        ) : latestJob.status === 'failed' ? (
                                                            <AlertCircle size={14} />
                                                        ) : (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        )}
                                                        <span>
                                                            {latestJob.status === 'success'
                                                                ? `Last sync: ${latestJob.itemsProcessed} items processed in ${latestJob.durationMs}ms`
                                                                : latestJob.status === 'failed'
                                                                    ? 'Last sync failed'
                                                                    : 'Syncing...'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </ListContainer>
                    )}
                </div>
            )}
        </div>
    );
};

export default CredentialsSection;
