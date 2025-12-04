"use client";

import React, { useState } from 'react';
import { User, Edit2, Trash2, KeyRound, Copy, Check } from 'lucide-react';
import { useData } from './store';
import type { Friend } from './types';
import {
    SectionContainer, ListContainer, EditForm, Input, TextArea, ActionBtn
} from './AdminComponents';
import { AdminAvatar } from '../AdminImage';

export const FriendsSection: React.FC = () => {
    const { friends, addFriend, updateFriend, deleteFriend, resetFriendPassword } = useData();
    const [editingFriend, setEditingFriend] = useState<Partial<Friend> | null>(null);
    const [passphrase, setPassphrase] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSaveFriend = async () => {
        if (!editingFriend?.name) return;

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
                setEditingFriend(null);
            } else {
                // Create new friend - will return passphrase
                const result = await addFriend({
                    name: editingFriend.name,
                    avatar: editingFriend.avatar,
                    cover: editingFriend.cover,
                    description: editingFriend.description,
                });
                setEditingFriend(null);
                if (result.passphrase) {
                    setPassphrase(result.passphrase);
                }
            }
        } catch (error) {
            console.error('Failed to save friend:', error);
        }
    };

    const handleResetPassword = async (id: string) => {
        try {
            const newPassphrase = await resetFriendPassword(id);
            setPassphrase(newPassphrase);
        } catch (error) {
            console.error('Failed to reset password:', error);
        }
    };

    const handleCopyPassphrase = () => {
        if (passphrase) {
            navigator.clipboard.writeText(passphrase);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteFriend = async (id: string) => {
        try {
            await deleteFriend(id);
        } catch (error) {
            console.error('Failed to delete friend:', error);
        }
    };

    return (
        <SectionContainer title="Friends" onAdd={() => setEditingFriend({})}>
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
                                    onClick={() => handleResetPassword(f.id)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                    title="Reset Password"
                                >
                                    <KeyRound size={16} />
                                </button>
                                <ActionBtn onClick={() => setEditingFriend(f)} icon={<Edit2 size={16} />} />
                                <ActionBtn onClick={() => handleDeleteFriend(f.id)} icon={<Trash2 size={16} />} danger />
                            </div>
                        </div>
                    ))}
                </ListContainer>
            )}
        </SectionContainer>
    );
};

export default FriendsSection;
