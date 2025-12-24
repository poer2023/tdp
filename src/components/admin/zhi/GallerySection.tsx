"use client";

import React, { useState, useEffect } from 'react';
import { X, Play, Edit2, Trash2 } from 'lucide-react';
import { useData } from './store';
import type { GalleryItem } from './types';
import {
    SectionContainer, Input, TextArea, ImageUploadArea
} from './AdminComponents';
import { AdminImage } from '../AdminImage';
import { useAdminLocale } from './useAdminLocale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export const GallerySection: React.FC = () => {
    const { addGalleryItem, updateGalleryItem, deleteGalleryItem } = useData();
    const { t } = useAdminLocale();

    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 32;

    const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string }[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null
    });

    const fetchGallery = React.useCallback(async (pageNum: number, append = false) => {
        setLoadingLocal(true);
        try {
            const res = await fetch(`/api/admin/gallery?page=${pageNum}&pageSize=${pageSize}`);
            const data = await res.json();
            if (res.ok && Array.isArray(data.images)) {
                if (append) {
                    setGalleryItems(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newItems = data.images.filter((i: GalleryItem) => !existingIds.has(i.id));
                        return [...prev, ...newItems];
                    });
                } else {
                    setGalleryItems(data.images);
                }
                if (data.images.length < pageSize) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch gallery', error);
        } finally {
            setLoadingLocal(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchGallery(1);
    }, [fetchGallery]);

    // Cleanup blob URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            uploadQueue.forEach(item => URL.revokeObjectURL(item.preview));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGallery(nextPage, true);
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

        if (isBatchMode) {
            setUploadQueue(prev => [...prev, ...newQueue]);
        } else {
            setUploadQueue(newQueue);
        }
    };

    const removeFileFromQueue = (idx: number) => {
        setUploadQueue(prev => {
            // Revoke the blob URL before removing
            if (prev[idx]) {
                URL.revokeObjectURL(prev[idx].preview);
            }
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGalleryItem(id);
            setGalleryItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete gallery item:', error);
        } finally {
            setDeleteConfirm({ open: false, id: null });
        }
    };

    const handleSaveGallery = async () => {
        try {
            // Batch Mode
            if (!editingGallery?.id && isBatchMode && uploadQueue.length > 0) {
                const results = await Promise.all(uploadQueue.map((item, idx) => addGalleryItem({
                    file: item.file,
                    title: editingGallery?.title ? `${editingGallery.title} ${idx + 1}` : `Upload ${new Date().toLocaleDateString()}`,
                    description: editingGallery?.description || '',
                    date: editingGallery?.date
                })));
                // Refresh list or add to state
                const newItems = results.filter((i): i is GalleryItem => !!i && !Array.isArray(i));
                setGalleryItems(prev => [...newItems, ...prev]);
            }
            // Single Mode (Edit or New)
            else {
                const basePayload = {
                    title: editingGallery?.title || 'Untitled',
                    description: editingGallery?.description || '',
                    date: editingGallery?.date
                };

                if (editingGallery?.id) {
                    const updated = await updateGalleryItem({
                        ...basePayload,
                        id: editingGallery.id,
                    });
                    if (updated && 'id' in updated) {
                        setGalleryItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                    }
                } else {
                    const file = uploadQueue[0]?.file;
                    if (!file && !manualUrl) return;
                    const newItem = await addGalleryItem({
                        ...basePayload,
                        file,
                        manualUrl
                    });
                    if (newItem && !Array.isArray(newItem)) {
                        setGalleryItems(prev => [newItem, ...prev]);
                    }
                }
            }

            // Cleanup blob URLs before clearing the queue
            uploadQueue.forEach(item => URL.revokeObjectURL(item.preview));

            setEditingGallery(null);
            setUploadQueue([]);
            setManualUrl('');
            setIsBatchMode(false);
        } catch (error) {
            console.error('Failed to save gallery:', error);
        }
    };

    return (
        <SectionContainer title={t('galleryTitle')} onAdd={() => { setEditingGallery({}); setUploadQueue([]); setIsBatchMode(false); setManualUrl(''); }}>
            {editingGallery ? (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                            {editingGallery?.id ? t('editImageInfo') : t('uploadMedia')}
                        </h3>
                        <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
                    </div>

                    {!editingGallery?.id && (
                        <div className="flex mb-6 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => { setIsBatchMode(false); setUploadQueue([]); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isBatchMode ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                {t('singleFile')}
                            </button>
                            <button
                                onClick={() => { setIsBatchMode(true); setUploadQueue([]); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isBatchMode ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                {t('batchUpload')}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {!editingGallery?.id && (
                            <div className="col-span-1 lg:col-span-1">
                                <ImageUploadArea
                                    queue={uploadQueue}
                                    onDrop={handleDrop}
                                    onFileSelect={handleFileSelect}
                                    onRemove={removeFileFromQueue}
                                    isDragOver={isDragOver}
                                    setIsDragOver={setIsDragOver}
                                    multiple={isBatchMode}
                                    manualUrl={manualUrl}
                                    setManualUrl={setManualUrl}
                                />
                            </div>
                        )}

                        <div className={`${!editingGallery?.id ? 'col-span-1 lg:col-span-2' : 'col-span-full'}`}>
                            <div className="space-y-4">
                                {!editingGallery?.id && isBatchMode ? (
                                    <Input
                                        label={t('batchNamePrefix')}
                                        value={editingGallery?.title || ''}
                                        onChange={v => setEditingGallery(prev => ({ ...prev!, title: v }))}
                                    />
                                ) : (
                                    <Input
                                        label={t('title')}
                                        value={editingGallery?.title || ''}
                                        onChange={v => setEditingGallery(prev => ({ ...prev!, title: v }))}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label={t('date')} value={editingGallery?.date || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, date: v }))} />
                                    <Input label={t('location')} value={editingGallery?.location || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, location: v }))} />
                                </div>

                                <TextArea label={t('description')} value={editingGallery?.description || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, description: v }))} />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="px-6 py-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">{t('cancel')}</button>
                                <button
                                    onClick={handleSaveGallery}
                                    disabled={!editingGallery?.id && uploadQueue.length === 0 && !manualUrl}
                                    className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold disabled:opacity-50"
                                >
                                    {editingGallery?.id ? t('updateInfo') : `${t('uploadCount')} ${uploadQueue.length > 0 ? `(${uploadQueue.length})` : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {loadingLocal && page === 1 ? (
                        <div className="col-span-full py-12 text-center text-stone-400">
                            {t('loadingGallery')}
                        </div>
                    ) : galleryItems.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-stone-400">
                            {t('noGalleryItems')}
                        </div>
                    ) : (
                        <>
                            {galleryItems.map((item, index) => (
                                <div key={item.id} className="relative group rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 aspect-square">
                                    <AdminImage
                                        src={item.smallThumbPath || item.thumbnail || item.url}
                                        alt={item.title || ''}
                                        className="w-full h-full"
                                        containerClassName="w-full h-full"
                                        priority={index < 4}
                                    />
                                    {item.type === 'video' && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"><Play size={12} /></div>}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => setEditingGallery(item)} className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Edit2 size={16} /></button>
                                        <button onClick={() => setDeleteConfirm({ open: true, id: item.id })} className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs truncate">
                                        {item.title}
                                    </div>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="col-span-full mt-8 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingLocal}
                                        className="px-6 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50"
                                    >
                                        {loadingLocal ? t('loadingImages') : t('loadMore')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
                title={t('confirmDeleteImage')}
                description={t('confirmDeleteImageDescription')}
                confirmText={t('cancel') === '取消' ? '删除' : 'Delete'}
                cancelText={t('cancel')}
                variant="danger"
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm({ open: false, id: null })}
            />
        </SectionContainer>
    );
};

export default GallerySection;
