"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Play, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useData } from './store';
import type { GalleryItem } from './types';
import {
    SectionContainer, Input, TextArea, ImageUploadArea
} from './AdminComponents';
import { AdminImage } from '../AdminImage';
import { useAdminLocale } from './useAdminLocale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpload, type UploadItem } from '@/hooks/use-upload';


export const GallerySection: React.FC = () => {
    const { updateGalleryItem, deleteGalleryItem } = useData();
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
    const [selectedCategory, setSelectedCategory] = useState<'ORIGINAL' | 'REPOST' | 'MOMENT'>('ORIGINAL');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'ORIGINAL' | 'REPOST' | 'MOMENT'>('ALL');
    const [reExtractingId, setReExtractingId] = useState<string | null>(null);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null
    });

    // Pending uploads for optimistic UI
    const [pendingUploads, setPendingUploads] = useState<UploadItem[]>([]);

    // Handle successful upload
    const handleUploadSuccess = useCallback((item: UploadItem, result: unknown) => {
        // Remove from pending and add real item to gallery
        setPendingUploads(prev => prev.filter(p => p.id !== item.id));
        const newItem = (result as { image?: GalleryItem })?.image;
        if (newItem) {
            setGalleryItems(prev => [newItem, ...prev]);
        }
    }, []);

    // Handle upload error
    const handleUploadError = useCallback((item: UploadItem) => {
        // Remove from pending after a delay so user can see the error
        setTimeout(() => {
            setPendingUploads(prev => prev.filter(p => p.id !== item.id));
        }, 3000);
    }, []);

    const upload = useUpload({
        onSuccess: handleUploadSuccess,
        onError: handleUploadError,
    });

    const fetchGallery = React.useCallback(async (pageNum: number, category: string, append = false) => {
        setLoadingLocal(true);
        try {
            const categoryParam = category !== 'ALL' ? `&category=${category}` : '';
            const res = await fetch(`/api/admin/gallery?page=${pageNum}&pageSize=${pageSize}${categoryParam}`);
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
        setPage(1);
        setHasMore(true);
        fetchGallery(1, filterCategory);
    }, [fetchGallery, filterCategory]);

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
        fetchGallery(nextPage, filterCategory, true);
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
            // Edit mode - keep synchronous for simplicity
            if (editingGallery?.id) {
                const basePayload = {
                    title: editingGallery?.title || 'Untitled',
                    description: editingGallery?.description || '',
                    date: editingGallery?.date
                };
                const updated = await updateGalleryItem({
                    ...basePayload,
                    id: editingGallery.id,
                });
                if (updated && 'id' in updated) {
                    setGalleryItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                }
                setEditingGallery(null);
                setUploadQueue([]);
                setManualUrl('');
                return;
            }

            // New upload mode - use optimistic updates
            if (uploadQueue.length === 0 && !manualUrl) return;

            // Create pending upload items for optimistic UI
            const newUploadItems: UploadItem[] = uploadQueue.map(item => ({
                id: crypto.randomUUID(),
                file: item.file,
                preview: item.preview,
                progress: 0,
                status: 'uploading' as const,
            }));

            // Add to pending uploads (will show as uploading cards)
            setPendingUploads(prev => [...newUploadItems, ...prev]);

            // Close the form immediately (optimistic)
            setEditingGallery(null);
            setUploadQueue([]);
            setManualUrl('');
            setIsBatchMode(false);

            // Upload in background
            const title = editingGallery?.title || `Upload ${new Date().toLocaleDateString()}`;
            const description = editingGallery?.description || '';

            for (let i = 0; i < newUploadItems.length; i++) {
                const item = newUploadItems[i];
                if (!item) continue;

                try {
                    await upload.uploadItem(item, '/api/admin/gallery/upload', {
                        title: isBatchMode && newUploadItems.length > 1 ? `${title} ${i + 1}` : title,
                        description,
                        category: selectedCategory,
                    });
                } catch (err) {
                    console.error('Upload failed:', err);
                    // Error is handled by the hook callback
                }
            }
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

                                {/* Category selector - only show for new uploads */}
                                {!editingGallery?.id && (
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                            分类
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'ORIGINAL', label: '自行发布' },
                                                { value: 'REPOST', label: '转发' },
                                            ].map((cat) => (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat.value as 'ORIGINAL' | 'REPOST' | 'MOMENT')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat.value
                                                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                                                        }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Location info section - only show when editing existing image */}
                                {editingGallery?.id && (
                                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                                📍 位置信息
                                            </span>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!editingGallery?.id) return;
                                                    setReExtractingId(editingGallery.id);
                                                    try {
                                                        const res = await fetch('/api/admin/gallery/re-extract-exif', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ imageId: editingGallery.id }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.ok && data.image) {
                                                            setEditingGallery(prev => ({
                                                                ...prev!,
                                                                latitude: data.image.latitude,
                                                                longitude: data.image.longitude,
                                                                locationName: data.extracted?.locationName,
                                                                city: data.extracted?.city,
                                                            }));
                                                            setGalleryItems(prev => prev.map(i =>
                                                                i.id === editingGallery.id ? { ...i, ...data.image } : i
                                                            ));
                                                            alert(data.extracted?.locationName ? `提取成功: ${data.extracted.locationName}` : '已更新位置数据');
                                                        } else {
                                                            alert(data.message || '未找到 GPS 数据');
                                                        }
                                                    } catch (err) {
                                                        console.error('Re-extract failed:', err);
                                                        alert('提取失败');
                                                    } finally {
                                                        setReExtractingId(null);
                                                    }
                                                }}
                                                disabled={reExtractingId === editingGallery.id}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {reExtractingId === editingGallery.id ? '提取中...' : '重新提取 EXIF'}
                                            </button>
                                        </div>

                                        {(editingGallery as any)?.latitude && (editingGallery as any)?.longitude ? (
                                            <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                                                <p>📍 {(editingGallery as any).locationName || (editingGallery as any).city || '未知位置'}</p>
                                                <p className="text-stone-400">经度: {(editingGallery as any).longitude?.toFixed(6)} | 纬度: {(editingGallery as any).latitude?.toFixed(6)}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-stone-400">暂无位置数据</p>
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(editingGallery as any)?.hideLocation || false}
                                                onChange={(e) => setEditingGallery(prev => ({ ...prev!, hideLocation: e.target.checked }))}
                                                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                                            />
                                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                                隐藏位置（不在地图上显示）
                                            </span>
                                        </label>
                                    </div>
                                )}
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
                <>
                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {(['ALL', 'ORIGINAL', 'REPOST', 'MOMENT'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterCategory === cat
                                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                    }`}
                            >
                                {cat === 'ALL' ? '全部' : cat === 'ORIGINAL' ? '自行发布' : cat === 'REPOST' ? '转发' : 'Moment'}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {loadingLocal && page === 1 ? (
                            <div className="col-span-full py-12 text-center text-stone-400">
                                {t('loadingGallery')}
                            </div>
                        ) : galleryItems.length === 0 && pendingUploads.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-stone-400">
                                {t('noGalleryItems')}
                            </div>
                        ) : (
                            <>
                                {/* Pending uploads - optimistic UI */}
                                {pendingUploads.map((item) => (
                                    <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 aspect-square">
                                        <Image
                                            src={item.preview}
                                            alt="Uploading"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                            {item.status === 'uploading' && (
                                                <>
                                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                                    <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-white rounded-full transition-all duration-300"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-white text-xs mt-1">{item.progress}%</span>
                                                </>
                                            )}
                                            {item.status === 'error' && (
                                                <div className="text-center px-2">
                                                    <X className="w-8 h-8 text-rose-400 mx-auto mb-1" />
                                                    <span className="text-rose-300 text-xs">Upload failed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

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
                </>
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
