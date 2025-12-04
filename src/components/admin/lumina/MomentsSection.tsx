"use client";

import React, { useState } from 'react';
import { useData } from './store';
import type { Moment } from './types';
import {
    SectionContainer, EditForm, Input, TextArea,
    ImageUploadArea, RichMomentItem
} from './AdminComponents';

export const MomentsSection: React.FC = () => {
    const { moments, addMoment, updateMoment, deleteMoment, loading } = useData();

    const [editingMoment, setEditingMoment] = useState<Partial<Moment> | null>(null);
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string }[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            const newQueue = files.map((file: File) => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setUploadQueue(prev => [...prev, ...newQueue]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!e.dataTransfer) return;
        const files = Array.from(e.dataTransfer.files) as File[];

        const newQueue = files.map((file: File) => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setUploadQueue(prev => [...prev, ...newQueue]);
    };

    const removeFileFromQueue = (idx: number) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSaveMoment = async () => {
        if (!editingMoment?.content) return;

        const newImages = uploadQueue.map(item => item.preview);
        if (manualUrl) newImages.push(manualUrl);

        const momentData = {
            ...editingMoment,
            images: [...(editingMoment.images || []), ...newImages],
            id: editingMoment.id || Math.random().toString(36).substr(2, 9),
            date: editingMoment.date || 'Just now',
            likes: editingMoment.likes || 0,
            comments: editingMoment.comments || [],
            type: 'moment' as const,
            status: editingMoment.status || 'PUBLISHED',
            visibility: editingMoment.visibility || 'PUBLIC'
        } as Moment;

        try {
            if (editingMoment.id) await updateMoment(momentData);
            else await addMoment(momentData);
        } catch (error) {
            console.error('Failed to save moment:', error);
            return;
        }

        setEditingMoment(null);
        setUploadQueue([]);
        setManualUrl('');
    };

    return (
        <SectionContainer title="Moments" onAdd={() => { setEditingMoment({}); setUploadQueue([]); setManualUrl(''); }}>
            {editingMoment ? (
                <EditForm title={editingMoment.id ? 'Edit Moment' : 'New Moment'} onSave={handleSaveMoment} onCancel={() => setEditingMoment(null)}>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <TextArea label="What's happening?" value={editingMoment.content} onChange={v => setEditingMoment({ ...editingMoment, content: v })} />
                                <Input label="Tags (Comma separated)" value={editingMoment.tags?.join(', ')} onChange={v => setEditingMoment({ ...editingMoment, tags: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Status</label>
                                        <select
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                            value={editingMoment.status || 'PUBLISHED'}
                                            onChange={e => setEditingMoment({ ...editingMoment, status: e.target.value as Moment['status'] })}
                                        >
                                            <option value="PUBLISHED">Published</option>
                                            <option value="DRAFT">Draft</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Visibility</label>
                                        <select
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                            value={editingMoment.visibility || 'PUBLIC'}
                                            onChange={e => setEditingMoment({ ...editingMoment, visibility: e.target.value as Moment['visibility'] })}
                                        >
                                            <option value="PUBLIC">Public</option>
                                            <option value="FRIENDS_ONLY">Friends only</option>
                                            <option value="PRIVATE">Private</option>
                                        </select>
                                    </div>
                                </div>
                                <Input label="Happened At" type="datetime-local" value={editingMoment.happenedAt || ''} onChange={v => setEditingMoment({ ...editingMoment, happenedAt: v })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Attached Images</label>
                                <ImageUploadArea
                                    queue={uploadQueue}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelect}
                                onRemove={removeFileFromQueue}
                                existingImages={editingMoment.images}
                                onRemoveExisting={(idx) => {
                                    const newImages = [...(editingMoment.images || [])];
                                    newImages.splice(idx, 1);
                                    setEditingMoment({ ...editingMoment, images: newImages });
                                }}
                                isDragOver={isDragOver}
                                setIsDragOver={setIsDragOver}
                                multiple={true}
                                manualUrl={manualUrl}
                                setManualUrl={setManualUrl}
                            />
                        </div>
                    </div>
                </EditForm>
            ) : (
                <div className="grid gap-4">
                    {loading?.moments ? (
                        <div className="text-sm text-stone-400">Loading moments...</div>
                    ) : moments.length === 0 ? (
                        <div className="text-sm text-stone-400">No moments yet.</div>
                    ) : (
                        moments.map(m => (
                            <RichMomentItem
                                key={m.id}
                                moment={m}
                                onEdit={() => setEditingMoment(m)}
                                onDelete={() => deleteMoment(m.id)}
                            />
                        ))
                    )}
                </div>
            )}
        </SectionContainer>
    );
};

export default MomentsSection;
