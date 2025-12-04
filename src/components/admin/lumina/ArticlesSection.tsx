"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useData } from './store';
import type { BlogPost } from './types';
import {
    SectionContainer, ListContainer, EditForm, Input, TextArea,
    ImageUploadArea, RichPostItem
} from './AdminComponents';

export const ArticlesSection: React.FC = () => {
    const { posts, addPost, updatePost, deletePost, loading } = useData();

    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string }[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDelete = async (id: string) => {
        try {
            await deletePost(id);
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
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
        setUploadQueue(newQueue);
    };

    const removeFileFromQueue = (idx: number) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSavePost = async () => {
        if (!editingPost?.title) return;

        let finalCoverPath = editingPost.coverImagePath || editingPost.imageUrl;
        if (manualUrl) finalCoverPath = manualUrl;
        else if (uploadQueue.length > 0) {
            finalCoverPath = uploadQueue[0]!.preview;
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

        try {
            if (editingPost.id) {
                await updatePost(postData);
            } else {
                await addPost(postData);
            }
            setEditingPost(null);
            setUploadQueue([]);
            setManualUrl('');
        } catch (error) {
            console.error('Failed to save article:', error);
        }
    };

    return (
        <SectionContainer title="Articles" onAdd={() => { setEditingPost({}); setUploadQueue([]); setManualUrl(''); }}>
            {editingPost ? (
                <EditForm title={editingPost.id ? 'Edit Article' : 'New Article'} onSave={handleSavePost} onCancel={() => setEditingPost(null)}>
                    <Input label="Title" value={editingPost.title} onChange={v => setEditingPost({ ...editingPost, title: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Category" value={editingPost.category} onChange={v => setEditingPost({ ...editingPost, category: v })} />
                        <Input label="Read Time" value={editingPost.readTime} onChange={v => setEditingPost({ ...editingPost, readTime: v })} />
                    </div>
                    <TextArea label="Excerpt" value={editingPost.excerpt} onChange={v => setEditingPost({ ...editingPost, excerpt: v })} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Content (Markdown)</label>
                            <textarea
                                className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none min-h-[300px] font-mono text-sm"
                                placeholder="Write your article content in Markdown..."
                                value={editingPost.content || ''}
                                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                            />
                        </div>
                        <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-4 bg-white dark:bg-stone-900 min-h-[300px] overflow-auto">
                            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Preview</div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-stone-800 dark:text-stone-100">
                                {editingPost.content ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {editingPost.content}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-stone-400">Start typing to see Markdown preview.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Status</label>
                            <select
                                className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                value={editingPost.status || 'DRAFT'}
                                onChange={e => setEditingPost({ ...editingPost, status: e.target.value as 'PUBLISHED' | 'DRAFT' })}
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Language</label>
                            <select
                                className="w-full p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                value={editingPost.locale || 'EN'}
                                onChange={e => setEditingPost({ ...editingPost, locale: e.target.value as 'EN' | 'ZH' })}
                            >
                                <option value="EN">English</option>
                                <option value="ZH">中文</option>
                            </select>
                        </div>
                    </div>

                    <Input label="Tags (Comma separated)" value={editingPost.tags?.join(', ')} onChange={v => setEditingPost({ ...editingPost, tags: v.split(',').map(s => s.trim()).filter(Boolean) })} />

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Cover Image</label>
                        <ImageUploadArea
                            queue={uploadQueue}
                            onDrop={handleDrop}
                            onFileSelect={handleFileSelect}
                            onRemove={removeFileFromQueue}
                            isDragOver={isDragOver}
                            setIsDragOver={setIsDragOver}
                            multiple={false}
                            currentImageUrl={editingPost.imageUrl}
                            manualUrl={manualUrl}
                            setManualUrl={setManualUrl}
                        />
                    </div>
                </EditForm>
            ) : (
                <ListContainer>
                    {loading?.posts ? (
                        <div className="text-sm text-stone-400">Loading articles...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-sm text-stone-400">No articles yet.</div>
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
    );
};

export default ArticlesSection;
