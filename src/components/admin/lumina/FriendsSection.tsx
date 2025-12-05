"use client";

import React, { useState, useCallback } from 'react';
import { User, Edit2, Trash2, KeyRound, Copy, Check, Loader2, RotateCcw } from 'lucide-react';
import { useData } from './store';
import type { Friend } from './types';
import {
    ListContainer, EditForm, Input, TextArea, ActionBtn
} from './AdminComponents';
import { AdminAvatar } from '../AdminImage';
import { SimpleToast } from './Toast';

export const FriendsSection: React.FC = () => {
    const { friends, addFriend, updateFriend, deleteFriend, resetFriendPassword, refreshFriends, loading } = useData();
    const [editingFriend, setEditingFriend] = useState<Partial<Friend> | null>(null);
    const [passphrase, setPassphrase] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [resettingId, setResettingId] = useState<string | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    const handleSaveFriend = async () => {
        if (!editingFriend?.name) {
            showToast('Name is required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            if (editingFriend.id) {
                // Update existing friend
                await updateFriend({
                    id: editingFriend.id,
                    name: editingFriend.name,
                    avatar: editingFriend.avatar,
                    cover: editingFriend.cover,
                    description: editingFriend.description,
                    createdAt: editingFriend.createdAt || new Date().toISOString(),
                });
                showToast('Friend updated successfully', 'success');
                setEditingFriend(null);
            } else {
                // Create new friend - will return passphrase
                const result = await addFriend({
                    name: editingFriend.name,
                    avatar: editingFriend.avatar,
                    cover: editingFriend.cover,
                    description: editingFriend.description,
                });
                showToast('Friend created successfully', 'success');
                setEditingFriend(null);
                if (result.passphrase) {
                    setPassphrase(result.passphrase);
                }
            }
        } catch (error) {
            console.error('Failed to save friend:', error);
            showToast('Failed to save friend', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (!confirm(`Reset password for ${name}? This will generate a new passphrase.`)) return;

        setResettingId(id);
        try {
            const newPassphrase = await resetFriendPassword(id);
            setPassphrase(newPassphrase);
            showToast('Password reset successfully', 'success');
        } catch (error) {
            console.error('Failed to reset password:', error);
            showToast('Failed to reset password', 'error');
        } finally {
            setResettingId(null);
        }
    };

    const handleCopyPassphrase = () => {
        if (passphrase) {
            navigator.clipboard.writeText(passphrase);
            setCopied(true);
            showToast('Passphrase copied to clipboard', 'success');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteFriend = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            await deleteFriend(id);
            showToast(`${name} deleted successfully`, 'success');
        } catch (error) {
            console.error('Failed to delete friend:', error);
            showToast('Failed to delete friend', 'error');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshFriends();
            showToast('Friends list refreshed', 'success');
        } catch {
            showToast('Failed to refresh', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
            {/* Toast Notification */}
            {toast && <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Friends</h2>
                    <p className="text-sm text-stone-500 mt-1">Manage friend accounts and access permissions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading.friends}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                        title="Refresh friends list"
                    >
                        <RotateCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setEditingFriend({})}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                    >
                        <User size={16} />
                        Add Friend
                    </button>
                </div>
            </div>

            {/* Passphrase Modal */}
            {passphrase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-md w-full mx-4 shadow-xl">
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                <KeyRound className="text-emerald-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Friend Passphrase</h3>
                            <p className="text-sm text-stone-500 mt-1">Save this passphrase - it won&apos;t be shown again!</p>
                        </div>

                        <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-lg flex items-center justify-between gap-3 mb-4">
                            <code className="font-mono text-lg text-stone-900 dark:text-stone-100 flex-1 text-center">
                                {passphrase}
                            </code>
                            <button
                                onClick={handleCopyPassphrase}
                                className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-stone-500" />}
                            </button>
                        </div>

                        <button
                            onClick={() => setPassphrase(null)}
                            className="w-full py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            I&apos;ve Saved It
                        </button>
                    </div>
                </div>
            )}

            {editingFriend ? (
                <EditForm
                    title={editingFriend.id ? 'Edit Friend' : 'New Friend'}
                    onSave={handleSaveFriend}
                    onCancel={() => setEditingFriend(null)}
                >
                    <Input
                        label="Name"
                        value={editingFriend.name || ''}
                        onChange={v => setEditingFriend({ ...editingFriend, name: v })}
                    />
                    <TextArea
                        label="Description"
                        value={editingFriend.description || ''}
                        onChange={v => setEditingFriend({ ...editingFriend, description: v })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Avatar URL"
                            value={editingFriend.avatar || ''}
                            onChange={v => setEditingFriend({ ...editingFriend, avatar: v })}
                        />
                        <Input
                            label="Cover Image URL"
                            value={editingFriend.cover || ''}
                            onChange={v => setEditingFriend({ ...editingFriend, cover: v })}
                        />
                    </div>
                </EditForm>
            ) : (
                <ListContainer>
                    {friends.map(f => (
                        <div key={f.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {f.avatar ? (
                                    <AdminAvatar src={f.avatar} alt={f.name} size={40} />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-sage-100 dark:bg-sage-900 text-sage-600">
                                        <User size={20} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-stone-900 dark:text-stone-100">{f.name}</h3>
                                    {f.description && (
                                        <p className="text-xs text-stone-500 line-clamp-1">{f.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleResetPassword(f.id, f.name)}
                                    disabled={resettingId === f.id}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reset Password"
                                >
                                    {resettingId === f.id ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                                </button>
                                <ActionBtn onClick={() => setEditingFriend(f)} icon={<Edit2 size={16} />} />
                                <ActionBtn onClick={() => handleDeleteFriend(f.id, f.name)} icon={<Trash2 size={16} />} danger />
                            </div>
                        </div>
                    ))}
                </ListContainer>
            )}
        </div>
    );
};

export default FriendsSection;
