"use client";

import React, { useState, useCallback } from 'react';
import { useData } from './store';
import type { BlogPost } from './types';
import {
    SectionContainer, ListContainer, EditForm, Input, TextArea,
    ImageUploadArea, RichPostItem
} from './AdminComponents';
import { SimpleToast } from './Toast';
import { useAdminLocale } from './useAdminLocale';
import { TiptapEditor } from '../TiptapEditor';
import { useImageUpload } from '@/hooks/useImageUpload';

export const ArticlesSection: React.FC = () => {
    const { posts, addPost, updatePost, deletePost, loading } = useData();
    const { t } = useAdminLocale();

    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Use the optimistic upload hook for cover images
    const {
        queue: uploadQueue,
        addFiles,
        removeFile,
        retryFile,
        clearQueue,
        getUploadedData,
        isUploading,
    } = useImageUpload({
        endpoint: '/api/admin/posts/upload',
        fieldName: 'image',
        autoUpload: true,
    });

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deletePost(id);
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // For cover image, we only want one file, so clear queue first
            clearQueue();
            const files = Array.from(e.target.files).slice(0, 1);
            addFiles(files);
        }
    }, [addFiles, clearQueue]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!e.dataTransfer) return;
        // For cover image, we only want one file
        clearQueue();
        const files = Array.from(e.dataTransfer.files).slice(0, 1);
        addFiles(files);
    }, [addFiles, clearQueue]);

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

    // Upload image for content (used by TiptapEditor)
    const handleContentImageUpload = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/admin/gallery/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await res.json();
        return data.image?.filePath || data.image?.mediumPath || '';
    }, []);

    const handleSavePost = async () => {
        if (!editingPost?.title?.trim()) {
            showToast(t('titleRequired'), 'error');
            return;
        }

        setIsSaving(true);

        try {
            // Determine cover image path
            let finalCoverPath = editingPost.coverImagePath || editingPost.imageUrl;

            if (manualUrl) {
                finalCoverPath = manualUrl;
            } else {
                // Get uploaded cover URL from the hook
                const uploadedData = getUploadedData();
                if (uploadedData.length > 0) {
                    const data = uploadedData[0] as Record<string, unknown>;
                    finalCoverPath = (data.coverUrl as string) ||
                        (data.mediumUrl as string) ||
                        (data.originalUrl as string) ||
                        finalCoverPath;
                }
            }

            const postData = {
                ...editingPost,
                coverImagePath: finalCoverPath,
                imageUrl: finalCoverPath, // For backward compatibility
                id: editingPost.id || Math.random().toString(36).substr(2, 9),
                date: editingPost.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                likes: editingPost.likes || 0,
                comments: editingPost.comments || [],
                type: 'article' as const,
                status: editingPost.status || 'DRAFT',
                locale: editingPost.locale || 'EN',
                content: editingPost.content || ''
            } as BlogPost;

            if (editingPost.id) {
                await updatePost(postData);
                showToast(t('articleUpdated'), 'success');
            } else {
                await addPost(postData);
                showToast(t('articleCreated'), 'success');
            }
            setEditingPost(null);
            clearQueue();
            setManualUrl('');
        } catch (error) {
            console.error('Failed to save article:', error);
            const errorMessage = error instanceof Error ? error.message : t('failedToSave');
            showToast(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingPost(null);
        clearQueue();
        setManualUrl('');
    };

    const handleStartNew = () => {
        setEditingPost({});
        clearQueue();
        setManualUrl('');
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <SectionContainer title={t('articles')} onAdd={handleStartNew}>
                {editingPost ? (
                    <EditForm
                        title={editingPost.id ? t('editArticle') : t('newArticle')}
                        onSave={handleSavePost}
                        onCancel={handleCancel}
                        isSaving={isSaving || isUploading}
                    >
                        <Input label={t('title')} value={editingPost.title} onChange={v => setEditingPost({ ...editingPost, title: v })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label={t('category')} value={editingPost.category} onChange={v => setEditingPost({ ...editingPost, category: v })} />
                            <Input label={t('readTime')} value={editingPost.readTime} onChange={v => setEditingPost({ ...editingPost, readTime: v })} />
                        </div>
                        <TextArea label={t('excerpt')} value={editingPost.excerpt} onChange={v => setEditingPost({ ...editingPost, excerpt: v })} />

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('contentMarkdown')}</label>
                            <TiptapEditor
                                content={editingPost.content || ''}
                                onChange={v => setEditingPost({ ...editingPost, content: v })}
                                placeholder={t('writeMarkdownContent') || 'Start writing...'}
                                onImageUpload={handleContentImageUpload}
                                autoSaveKey={`post-draft-${editingPost.id || 'new'}`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('status')}</label>
                                <select
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                    value={editingPost.status || 'DRAFT'}
                                    onChange={e => setEditingPost({ ...editingPost, status: e.target.value as 'PUBLISHED' | 'DRAFT' })}
                                >
                                    <option value="DRAFT">{t('draft')}</option>
                                    <option value="PUBLISHED">{t('published')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('language')}</label>
                                <select
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                    value={editingPost.locale || 'EN'}
                                    onChange={e => setEditingPost({ ...editingPost, locale: e.target.value as 'EN' | 'ZH' })}
                                >
                                    <option value="EN">{t('english')}</option>
                                    <option value="ZH">{t('chinese')}</option>
                                </select>
                            </div>
                        </div>

                        <Input label={t('tagsCommaSeparated')} value={editingPost.tags?.join(', ')} onChange={v => setEditingPost({ ...editingPost, tags: v.split(',').map(s => s.trim()).filter(Boolean) })} />

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('coverImage')}</label>
                            <ImageUploadArea
                                queue={uploadQueue}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelect}
                                onRemove={handleRemoveFromQueue}
                                onRetry={handleRetry}
                                isDragOver={isDragOver}
                                setIsDragOver={setIsDragOver}
                                multiple={false}
                                currentImageUrl={editingPost.imageUrl}
                                manualUrl={manualUrl}
                                setManualUrl={setManualUrl}
                            />
                            {isUploading && (
                                <p className="text-xs text-blue-500 mt-2 animate-pulse">
                                    Uploading cover image in background...
                                </p>
                            )}
                        </div>
                    </EditForm>
                ) : (
                    <ListContainer>
                        {loading?.posts ? (
                            <div className="text-sm text-stone-400">{t('loadingArticles')}</div>
                        ) : posts.length === 0 ? (
                            <div className="text-sm text-stone-400">{t('noArticlesYet')}</div>
                        ) : (
                            posts.map(post => (
                                <RichPostItem
                                    key={post.id}
                                    post={post}
                                    onEdit={() => setEditingPost(post)}
                                    onDelete={() => handleDelete(post.id)}
                                />
                            ))
                        )}
                    </ListContainer>
                )}
            </SectionContainer>
        </>
    );
};

export default ArticlesSection;

