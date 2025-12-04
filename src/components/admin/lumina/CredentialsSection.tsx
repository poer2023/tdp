"use client";

import React, { useState } from 'react';
import { Key, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { useData } from './store';
import type { Credential } from './types';
import {
    SectionContainer, ListContainer, EditForm, Input, ActionBtn
} from './AdminComponents';

export const CredentialsSection: React.FC = () => {
    const { credentials, addCredential, updateCredential, deleteCredential, triggerSync } = useData();
    const [editingCredential, setEditingCredential] = useState<Partial<Credential> | null>(null);

    const handleSaveCredential = () => {
        if (!editingCredential?.platform || !editingCredential?.identifier) return;
        const credData = {
            ...editingCredential,
            id: editingCredential.id || Math.random().toString(36).substr(2, 9),
            name: editingCredential.name || editingCredential.platform,
            status: editingCredential.status || 'active',
            type: editingCredential.type || 'token',
            identifier: editingCredential.identifier?.trim(),
            failureCount: editingCredential.failureCount || 0
        } as Credential;

        if (editingCredential.id) updateCredential(credData);
        else addCredential(credData);
        setEditingCredential(null);
    };

    return (
        <SectionContainer title="Credentials & Sync" onAdd={() => setEditingCredential({})}>
            {editingCredential ? (
                <EditForm title={editingCredential.id ? 'Edit Credential' : 'New Credential'} onSave={handleSaveCredential} onCancel={() => setEditingCredential(null)}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Platform" value={editingCredential.platform || ''} onChange={v => setEditingCredential({ ...editingCredential, platform: v as any })} />
                        <Input label="Name" value={editingCredential.name || ''} onChange={v => setEditingCredential({ ...editingCredential, name: v })} />
                    </div>
                    <Input label="Identifier (Cookie/Token)" value={editingCredential.identifier || ''} onChange={v => setEditingCredential({ ...editingCredential, identifier: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Type" value={editingCredential.type || ''} onChange={v => setEditingCredential({ ...editingCredential, type: v as any })} />
                        <div className="flex items-center gap-2 mt-6">
                            <div className={`w-3 h-3 rounded-full ${editingCredential.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className="text-sm capitalize">{editingCredential.status || 'active'}</span>
                        </div>
                    </div>
                </EditForm>
            ) : (
                <div className="space-y-8">
                    <ListContainer>
                        {credentials.map(c => (
                            <div key={c.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                            {c.platform}
                                            <span className="text-xs font-normal text-stone-400 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">{c.name}</span>
                                        </h3>
                                        <p className="text-xs text-stone-500 font-mono mt-1">{c.identifier}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right text-xs">
                                        <div className={c.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}>{c.status.toUpperCase()}</div>
                                        <div className="text-stone-400">Last Sync: {c.lastSync || 'Never'}</div>
                                    </div>
                                    <button
                                        onClick={() => triggerSync(c.id)}
                                        className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
                                        title="Trigger Sync"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <ActionBtn onClick={() => setEditingCredential(c)} icon={<Edit2 size={16} />} />
                                    <ActionBtn onClick={() => deleteCredential(c.id)} icon={<Trash2 size={16} />} danger />
                                </div>
                            </div>
                        ))}
                    </ListContainer>
                </div>
            )}
        </SectionContainer>
    );
};

export default CredentialsSection;
