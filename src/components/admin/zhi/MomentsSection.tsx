"use client";

import React, { useState } from 'react';
import { useData } from './store';
import type { Moment, MomentImage } from './types';
import {
    SectionContainer, EditForm, Input, TextArea,
    ImageUploadArea, RichMomentItem
} from './AdminComponents';
import { useAdminLocale } from './useAdminLocale';

export const MomentsSection: React.FC = () => {
    const { moments, addMoment, updateMoment, deleteMoment, loading } = useData();
    const { t } = useAdminLocale();

    const [editingMoment, setEditingMoment] = useState<Partial<Moment> | null>(null);
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string }[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const revokePreviewUrls = (items: { preview: string }[]) => {
        items.forEach(item => URL.revokeObjectURL(item.preview));
    };

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
        setUploadQueue(prev => {
            const target = prev[idx];
            if (target) URL.revokeObjectURL(target.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSaveMoment = async () => {
        if (!editingMoment?.content) return;
        setIsSaving(true);

        // Upload new images first to get real URLs
        const uploadedImageUrls: (string | MomentImage)[] = [];
        for (const item of uploadQueue) {
            try {
                const formData = new FormData();
                formData.append('image', item.file);  // Use 'image' as field name, matching gallery upload
                formData.append('title', `Moment image ${new Date().toLocaleDateString()}`);

                const uploadRes = await fetch('/api/admin/gallery/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    // The gallery upload returns the image object with filePath
                    if (uploadData.image?.filePath) {
                        uploadedImageUrls.push({
                            url: uploadData.image.filePath,
                            microThumbUrl: uploadData.image.microThumbPath,
                            smallThumbUrl: uploadData.image.smallThumbPath,
                            mediumUrl: uploadData.image.mediumPath,
                            w: uploadData.image.width,
                            h: uploadData.image.height
                        });
                    } else if (uploadData.images?.[0]?.filePath) {
                        uploadedImageUrls.push(uploadData.images[0].filePath);
                    } else if (uploadData.url) {
                        uploadedImageUrls.push(uploadData.url);
                    }
                } else {
                    console.error('Failed to upload image:', await uploadRes.text());
                }
            } catch (error) {
                console.error('Image upload failed:', error);
            }
            // Revoke blob URL after upload attempt
            URL.revokeObjectURL(item.preview);
        }

        // Add manual URL if provided
        if (manualUrl && (manualUrl.startsWith('/') || manualUrl.startsWith('http'))) {
            uploadedImageUrls.push(manualUrl);
        }

        const momentData = {
            ...editingMoment,
            images: [...(editingMoment.images || []), ...uploadedImageUrls],
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
        revokePreviewUrls(uploadQueue);
        setUploadQueue([]);
        setManualUrl('');
        setIsSaving(false);
    };

    return (
        <SectionContainer title={t('momentsTitle')} onAdd={() => { setEditingMoment({}); revokePreviewUrls(uploadQueue); setUploadQueue([]); setManualUrl(''); }}>
            {editingMoment ? (
                <EditForm title={editingMoment.id ? t('editMoment') : t('newMoment')} onSave={handleSaveMoment} onCancel={() => { setEditingMoment(null); revokePreviewUrls(uploadQueue); setUploadQueue([]); setManualUrl(''); }} isSaving={isSaving}>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <TextArea label={t('whatsHappening')} value={editingMoment.content} onChange={v => setEditingMoment({ ...editingMoment, content: v })} />
                            <Input label={t('tagsCommaSeparated')} value={editingMoment.tags?.join(', ')} onChange={v => setEditingMoment({ ...editingMoment, tags: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('status')}</label>
                                    <select
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                        value={editingMoment.status || 'PUBLISHED'}
                                        onChange={e => setEditingMoment({ ...editingMoment, status: e.target.value as Moment['status'] })}
                                    >
                                        <option value="PUBLISHED">{t('published')}</option>
                                        <option value="DRAFT">{t('draft')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('visibility')}</label>
                                    <select
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                        value={editingMoment.visibility || 'PUBLIC'}
                                        onChange={e => setEditingMoment({ ...editingMoment, visibility: e.target.value as Moment['visibility'] })}
                                    >
                                        <option value="PUBLIC">{t('public')}</option>
                                        <option value="FRIENDS_ONLY">{t('friendsOnly')}</option>
                                        <option value="PRIVATE">{t('private')}</option>
                                    </select>
                                </div>
                            </div>
                            <Input label={t('happenedAt')} type="datetime-local" value={editingMoment.happenedAt || ''} onChange={v => setEditingMoment({ ...editingMoment, happenedAt: v })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('attachedImages')}</label>
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
                        <div className="text-sm text-stone-400">{t('loadingMoments')}</div>
                    ) : moments.length === 0 ? (
                        <div className="text-sm text-stone-400">{t('noMomentsYet')}</div>
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
