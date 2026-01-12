"use client";

import React, { useState, useCallback } from 'react';
import { useData } from './store';
import type { Moment, MomentImage } from './types';
import {
    SectionContainer, EditForm, TextArea,
    ImageUploadArea, RichMomentItem
} from './AdminComponents';
import { useAdminLocale } from './useAdminLocale';
import { useImageUpload } from '@/hooks/useImageUpload';

export const MomentsSection: React.FC = () => {
    const { moments, addMoment, updateMoment, deleteMoment, loading } = useData();
    const { t } = useAdminLocale();

    const [editingMoment, setEditingMoment] = useState<Partial<Moment> | null>(null);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Use the optimistic upload hook
    const {
        queue: uploadQueue,
        addFiles,
        removeFile,
        retryFile,
        clearQueue,
        getUploadedData,
        isUploading,
    } = useImageUpload({
        endpoint: '/api/admin/gallery/upload',
        fieldName: 'image',
        extraFormData: {
            title: `Moment image ${new Date().toLocaleDateString()}`,
            category: 'MOMENT',
        },
        autoUpload: true,
    });

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            addFiles(files);
        }
    }, [addFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!e.dataTransfer) return;
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    }, [addFiles]);

    const handleRemoveFromQueue = useCallback((idx: number) => {
        const item = uploadQueue[idx];
        if (item) {
            removeFile(item.id);
        }
    }, [uploadQueue, removeFile]);

    const handleRetry = useCallback((idx: number) => {
        const item = uploadQueue[idx];
        if (item) {
            retryFile(item.id);
        }
    }, [uploadQueue, retryFile]);

    const handleSaveMoment = async () => {
        if (!editingMoment?.content) return;
        setIsSaving(true);

        // Get all successfully uploaded data (images and videos)
        const uploadedData = getUploadedData();
        const uploadedImages: MomentImage[] = [];
        const uploadedVideos: { url: string; previewUrl?: string; thumbnailUrl?: string; duration?: number; w?: number; h?: number }[] = [];

        uploadedData.forEach((data) => {
            const img = data.image as Record<string, unknown> | undefined;
            const isVideo = data.isVideo === true || (img?.mimeType as string)?.startsWith('video/');

            if (isVideo) {
                // Handle video upload result
                uploadedVideos.push({
                    url: (data.videoUrl as string) || (img?.filePath as string) || '',
                    previewUrl: (data.videoUrl as string) || (img?.filePath as string) || '',
                    thumbnailUrl: '',
                    duration: 0,
                    w: img?.width as number | undefined,
                    h: img?.height as number | undefined,
                });
            } else if (img?.filePath) {
                // Handle image upload result
                uploadedImages.push({
                    url: img.filePath as string,
                    microThumbUrl: img.microThumbPath as string | undefined,
                    smallThumbUrl: img.smallThumbPath as string | undefined,
                    mediumUrl: img.mediumPath as string | undefined,
                    w: img.width as number | undefined,
                    h: img.height as number | undefined,
                });
            }
        });

        // Add manual URL if provided (assume image for now)
        if (manualUrl && (manualUrl.startsWith('/') || manualUrl.startsWith('http'))) {
            uploadedImages.push({ url: manualUrl });
        }

        const momentData = {
            ...editingMoment,
            images: [...(editingMoment.images || []), ...uploadedImages],
            videos: [...(editingMoment.videos || []), ...uploadedVideos],
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
            setIsSaving(false);
            return;
        }

        setEditingMoment(null);
        clearQueue();
        setManualUrl('');
        setIsSaving(false);
    };

    const handleCancel = () => {
        setEditingMoment(null);
        clearQueue();
        setManualUrl('');
    };

    const handleStartNew = () => {
        setEditingMoment({});
        clearQueue();
        setManualUrl('');
    };

    return (
        <SectionContainer title={t('momentsTitle')} onAdd={handleStartNew}>
            {editingMoment ? (
                <EditForm
                    title={editingMoment.id ? t('editMoment') : t('newMoment')}
                    onSave={handleSaveMoment}
                    onCancel={handleCancel}
                    isSaving={isSaving || isUploading}
                >
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <TextArea label={t('whatsHappening')} value={editingMoment.content} onChange={v => setEditingMoment({ ...editingMoment, content: v })} />
                            <div className="flex items-center justify-end">
                                <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                    <input
                                        type="checkbox"
                                        checked={editingMoment.showLocation ?? true}
                                        onChange={e => setEditingMoment({ ...editingMoment, showLocation: e.target.checked })}
                                        className="peer sr-only"
                                    />
                                    <span className="relative h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-sage-500 peer-checked:after:translate-x-5 dark:bg-stone-600 dark:peer-checked:bg-sage-500" />
                                    <span>显示位置信息</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('attachedImages')}</label>
                            <ImageUploadArea
                                queue={uploadQueue}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelect}
                                onRemove={handleRemoveFromQueue}
                                onRetry={handleRetry}
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
                                acceptVideo={true}
                            />
                            {isUploading && (
                                <p className="text-xs text-blue-500 mt-2 animate-pulse">
                                    Uploading images in background...
                                </p>
                            )}
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

