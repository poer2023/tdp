"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import {
    LayoutTemplate, Home, FileText, Image as ImageIcon,
    Briefcase, Link2, Camera, Layers, Users, CreditCard,
    Key, LogOut, Menu, X, Play, Edit2, Trash2,
    Database, TrendingUp, RefreshCw, Terminal, Sun, Moon
} from 'lucide-react';
import { useData, useSettings } from './store';
import type { Tab, BlogPost, Moment, Project, ShareItem, GalleryItem, Friend, Subscription, Credential } from './types';
import {
    NavBtn, SectionContainer, ListContainer, ListItem, ActionBtn,
    EditForm, Input, TextArea, DataSection, OverviewSection,
    ImageUploadArea, RichPostItem, RichMomentItem
} from './AdminComponents';
import { AdminImage, AdminAvatar } from '../AdminImage';

interface AdminDashboardProps {
    user: {
        username: string;
        email: string;
        role: string;
    }
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
    const {
        posts, moments, projects, shareItems, galleryItems, galleryCount,
        movieData, gameData, skillData, photoStats, routineData, stepsData, heroImages,
        friends, subscriptions, credentials, syncJobs,
        addPost, updatePost, deletePost,
        addMoment, updateMoment, deleteMoment,
        addProject, updateProject, deleteProject,
        addShareItem, updateShareItem, deleteShareItem,
        addGalleryItem, updateGalleryItem, deleteGalleryItem,
        addFriend, updateFriend, deleteFriend,
        addSubscription, updateSubscription, deleteSubscription,
        addCredential, updateCredential, deleteCredential, triggerSync,
        updateMovieData, updateGameData, updateSkillData, updatePhotoStats, updateRoutineData, updateStepsData,
        addHeroImage, deleteHeroImage,
        convertCurrency
    } = useData();
    const { theme, toggleTheme } = useSettings();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Edit States
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [editingMoment, setEditingMoment] = useState<Partial<Moment> | null>(null);
    const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
    const [editingShare, setEditingShare] = useState<Partial<ShareItem> | null>(null);
    const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);

    // New Module Edit States
    const [editingFriend, setEditingFriend] = useState<Partial<Friend> | null>(null);
    const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription> | null>(null);
    const [editingCredential, setEditingCredential] = useState<Partial<Credential> | null>(null);

    // Universal Upload State
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string }[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Hero Image State
    const [newHeroImage, setNewHeroImage] = useState('');

    // --- Handlers ---

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newQueue = files.map(file => ({
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
        const files = Array.from(e.dataTransfer.files);

        const newQueue = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        // Assuming 'multiple' is a state or prop that determines if multiple files are allowed.
        // If not defined, it will default to false, meaning only one file is kept.
        // For now, I'll assume `isBatchMode` serves a similar purpose for multiple uploads.
        if (isBatchMode) { // Changed 'multiple' to 'isBatchMode' for logical consistency with existing code
            setUploadQueue(prev => [...prev, ...newQueue]);
        } else {
            setUploadQueue(newQueue);
        }
    };
    const removeFileFromQueue = (idx: number) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== idx));
    };

    // Save Handlers
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
            imageUrl: finalCoverPath,
            content: editingPost.content || '',
            id: editingPost.id || Math.random().toString(36).substr(2, 9),
            date: editingPost.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            likes: editingPost.likes || 0,
            comments: editingPost.comments || [],
            type: 'article' as const,
            status: editingPost.status || 'DRAFT',
            locale: editingPost.locale || 'EN'
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

    const handleDeletePost = async (id: string) => {
        try {
            await deletePost(id);
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
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

    const handleSaveProject = () => {
        if (!editingProject?.title) return;
        const projectData = {
            ...editingProject,
            id: editingProject.id || Math.random().toString(36).substr(2, 9),
            technologies: editingProject.technologies || [],
            features: editingProject.features || []
        } as Project;

        if (editingProject.id) updateProject(projectData);
        else addProject(projectData);
        setEditingProject(null);
    };

    const handleSaveShare = () => {
        if (!editingShare?.title) return;
        const shareData = {
            ...editingShare,
            id: editingShare.id || Math.random().toString(36).substr(2, 9),
            date: editingShare.date || 'Just now',
            likes: editingShare.likes || 0,
            type: 'share' as const
        } as ShareItem;

        if (editingShare.id) updateShareItem(shareData);
        else addShareItem(shareData);
        setEditingShare(null);
    };

    const handleSaveGallery = async () => {
        try {
            // Batch Mode
            if (!editingGallery?.id && isBatchMode && uploadQueue.length > 0) {
                await Promise.all(uploadQueue.map((item, idx) => addGalleryItem({
                    file: item.file,
                    title: editingGallery?.title ? `${editingGallery.title} ${idx + 1}` : `Upload ${new Date().toLocaleDateString()}`,
                    description: editingGallery?.description || '',
                    date: editingGallery?.date
                })));
            }
            // Single Mode (Edit or New)
            else {
                const basePayload = {
                    title: editingGallery?.title || 'Untitled',
                    description: editingGallery?.description || '',
                    date: editingGallery?.date
                };

                if (editingGallery?.id) {
                    await updateGalleryItem({
                        ...basePayload,
                        id: editingGallery.id,
                    });
                } else {
                    const file = uploadQueue[0]?.file;
                    if (!file && !manualUrl) return;
                    await addGalleryItem({
                        ...basePayload,
                        file,
                        manualUrl
                    });
                }
            }

            setEditingGallery(null);
            setUploadQueue([]);
            setManualUrl('');
            setIsBatchMode(false);
        } catch (error) {
            console.error('Failed to save gallery:', error);
        }
    };

    const handleDeleteGalleryItem = async (id: string) => {
        try {
            await deleteGalleryItem(id);
        } catch (error) {
            console.error('Failed to delete gallery item:', error);
        }
    };

    const handleAddHeroImage = async () => {
        if (newHeroImage) {
            await addHeroImage({
                url: newHeroImage,
                sortOrder: heroImages.length,
                active: true
            });
            setNewHeroImage('');
        }
    };

    const handleRemoveHeroImage = async (id: string) => {
        await deleteHeroImage(id);
    };

    // --- New Module Handlers ---
    const handleSaveFriend = async () => {
        if (!editingFriend?.name) return;

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
        } else {
            // Create new friend - passphrase is handled in standalone FriendsSection
            await addFriend({
                name: editingFriend.name,
                avatar: editingFriend.avatar,
                cover: editingFriend.cover,
                description: editingFriend.description,
            });
        }
        setEditingFriend(null);
    };

    const handleSaveSubscription = () => {
        if (!editingSubscription?.name) return;
        const subData = {
            ...editingSubscription,
            id: editingSubscription.id || Math.random().toString(36).substr(2, 9),
            active: editingSubscription.active ?? true,
            price: Number(editingSubscription.price) || 0
        } as Subscription;

        if (editingSubscription.id) updateSubscription(subData);
        else addSubscription(subData);
        setEditingSubscription(null);
    };

    const handleSaveCredential = () => {
        if (!editingCredential?.name) return;
        const credData = {
            ...editingCredential,
            id: editingCredential.id || Math.random().toString(36).substr(2, 9),
            status: editingCredential.status || 'active',
            failureCount: editingCredential.failureCount || 0
        } as Credential;

        if (editingCredential.id) updateCredential(credData);
        else addCredential(credData);
        setEditingCredential(null);
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-black text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300 flex">

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 bg-stone-900 text-stone-300 w-64 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-900 font-bold font-serif">L</div>
                        <h1 className="text-xl font-bold text-white tracking-tight">ZHI CMS</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-stone-400"><X /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-4">Content</div>
                    <NavBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutTemplate size={18} />} label="Overview" />
                    <NavBtn active={activeTab === 'stats'} onClick={() => router.push('/admin/analytics')} icon={<TrendingUp size={18} />} label="Analytics" />
                    <NavBtn active={activeTab === 'posts'} onClick={() => router.push('/admin/articles')} icon={<FileText size={18} />} label="Articles" />
                    <NavBtn active={activeTab === 'moments'} onClick={() => router.push('/admin/moments')} icon={<ImageIcon size={18} />} label="Moments" />
                    <NavBtn active={activeTab === 'projects'} onClick={() => router.push('/admin/projects')} icon={<Briefcase size={18} />} label="Projects" />
                    <NavBtn active={activeTab === 'curated'} onClick={() => router.push('/admin/curated')} icon={<Link2 size={18} />} label="Curated" />
                    <NavBtn active={activeTab === 'gallery'} onClick={() => router.push('/admin/gallery')} icon={<Camera size={18} />} label="Gallery" />

                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 mb-2 mt-6">System</div>
                    <NavBtn active={activeTab === 'hero'} onClick={() => router.push('/admin/hero')} icon={<Layers size={18} />} label="Hero Grid" />
                    <NavBtn active={activeTab === 'data'} onClick={() => router.push('/admin/data')} icon={<Database size={18} />} label="Life Data" />
                    <NavBtn active={activeTab === 'friends'} onClick={() => router.push('/admin/friends')} icon={<Users size={18} />} label="Friends" />
                    <NavBtn active={activeTab === 'subscriptions'} onClick={() => router.push('/admin/subscriptions')} icon={<CreditCard size={18} />} label="Subscriptions" />
                    <NavBtn active={activeTab === 'credentials'} onClick={() => router.push('/admin/credentials')} icon={<Key size={18} />} label="Credentials" />
                </nav>

                <div className="p-4 border-t border-stone-800">
                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors text-sm"
                            title="返回主页"
                        >
                            <Home size={16} />
                            <span className="text-xs">主页</span>
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors text-sm"
                            title="切换主题"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            <span className="text-xs">{theme === 'dark' ? '浅色' : '深色'}</span>
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-stone-600"></div>
                        <div>
                            <div className="text-sm font-bold text-white">{user.username}</div>
                            <div className="text-xs text-stone-500 capitalize">{user.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/signout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            router.push('/login');
                            router.refresh();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto bg-stone-50 dark:bg-black relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center sticky top-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-stone-600 dark:text-stone-300"><Menu /></button>
                    <span className="font-bold text-stone-900 dark:text-stone-100">ZHI CMS</span>
                    <div className="w-8"></div>
                </header>

                <div className="p-6 lg:p-10">
                    {/* Top Bar */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 capitalize">{activeTab}</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Manage your content and settings</p>
                    </div>

                    {/* Content Area */}

                    {activeTab === 'overview' && (
                        <OverviewSection
                            posts={posts}
                            moments={moments}
                            galleryCount={galleryCount}
                            projects={projects}
                            shareItems={shareItems}
                            onQuickAction={setActiveTab}
                        />
                    )}

                    {activeTab === 'posts' && (
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
                                    {posts.map(post => (
                                        <RichPostItem
                                            key={post.id}
                                            post={post}
                                            onEdit={() => setEditingPost(post)}
                                            onDelete={() => handleDeletePost(post.id)}
                                        />
                                    ))}
                                </ListContainer>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'moments' && (
                        <SectionContainer title="Moments" onAdd={() => { setEditingMoment({}); setUploadQueue([]); setManualUrl(''); }}>
                            {editingMoment ? (
                                <EditForm title={editingMoment.id ? 'Edit Moment' : 'New Moment'} onSave={handleSaveMoment} onCancel={() => setEditingMoment(null)}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-4">
                                            <TextArea label="What's happening?" value={editingMoment.content} onChange={v => setEditingMoment({ ...editingMoment, content: v })} />
                                            <Input label="Tags (Comma separated)" value={editingMoment.tags?.join(', ')} onChange={v => setEditingMoment({ ...editingMoment, tags: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label="Location (地点)" value={editingMoment.location || ''} onChange={v => setEditingMoment({ ...editingMoment, location: v })} />
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
                                            <div className="flex items-center gap-3">
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
                                    {moments.map(m => (
                                        <RichMomentItem
                                            key={m.id}
                                            moment={m}
                                            onEdit={() => setEditingMoment(m)}
                                            onDelete={() => deleteMoment(m.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'projects' && (
                        <SectionContainer title="Projects" onAdd={() => setEditingProject({})}>
                            {editingProject ? (
                                <EditForm title={editingProject.id ? 'Edit Project' : 'New Project'} onSave={handleSaveProject} onCancel={() => setEditingProject(null)}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Title" value={editingProject.title} onChange={v => setEditingProject({ ...editingProject, title: v })} />
                                        <Input label="Role" value={editingProject.role} onChange={v => setEditingProject({ ...editingProject, role: v })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Year" value={editingProject.year} onChange={v => setEditingProject({ ...editingProject, year: v })} />
                                        <Input label="Date" value={editingProject.date} onChange={v => setEditingProject({ ...editingProject, date: v })} />
                                    </div>
                                    <TextArea label="Description" value={editingProject.description} onChange={v => setEditingProject({ ...editingProject, description: v })} />
                                    <Input label="Image URL" value={editingProject.imageUrl} onChange={v => setEditingProject({ ...editingProject, imageUrl: v })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Demo URL" value={editingProject.demoUrl} onChange={v => setEditingProject({ ...editingProject, demoUrl: v })} />
                                        <Input label="Repo URL" value={editingProject.repoUrl} onChange={v => setEditingProject({ ...editingProject, repoUrl: v })} />
                                    </div>
                                    <Input label="Technologies (Comma separated)" value={editingProject.technologies?.join(', ')} onChange={v => setEditingProject({ ...editingProject, technologies: v.split(',').map(s => s.trim()) })} />
                                    <Input label="Features (Comma separated)" value={editingProject.features?.join(', ')} onChange={v => setEditingProject({ ...editingProject, features: v.split(',').map(s => s.trim()) })} />
                                </EditForm>
                            ) : (
                                <ListContainer>
                                    {projects.map(p => (
                                        <ListItem key={p.id} title={p.title} subtitle={p.role} onEdit={() => setEditingProject(p)} onDelete={() => deleteProject(p.id)} image={p.imageUrl} />
                                    ))}
                                </ListContainer>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'curated' && (
                        <SectionContainer title="Curated Links" onAdd={() => setEditingShare({})}>
                            {editingShare ? (
                                <EditForm title={editingShare.id ? 'Edit Share' : 'New Share'} onSave={handleSaveShare} onCancel={() => setEditingShare(null)}>
                                    <Input label="Title" value={editingShare.title} onChange={v => setEditingShare({ ...editingShare, title: v })} />
                                    <Input label="URL" value={editingShare.url} onChange={v => setEditingShare({ ...editingShare, url: v })} />
                                    <TextArea label="Description" value={editingShare.description} onChange={v => setEditingShare({ ...editingShare, description: v })} />
                                    <Input label="Domain (Optional)" value={editingShare.domain} onChange={v => setEditingShare({ ...editingShare, domain: v })} />
                                    <Input label="Image URL (Optional)" value={editingShare.imageUrl} onChange={v => setEditingShare({ ...editingShare, imageUrl: v })} />
                                    <Input label="Tags" value={editingShare.tags?.join(', ')} onChange={v => setEditingShare({ ...editingShare, tags: v.split(',').map(s => s.trim()) })} />
                                </EditForm>
                            ) : (
                                <ListContainer>
                                    {shareItems.map(s => (
                                        <ListItem key={s.id} title={s.title} subtitle={s.domain} onEdit={() => setEditingShare(s)} onDelete={() => deleteShareItem(s.id)} />
                                    ))}
                                </ListContainer>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'gallery' && (
                        <SectionContainer title="Gallery" onAdd={() => { setEditingGallery({}); setUploadQueue([]); setIsBatchMode(false); setManualUrl(''); }}>
                            {editingGallery ? (
                                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                            {editingGallery?.id ? 'Edit Image Info' : 'Upload Media'}
                                        </h3>
                                        <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
                                    </div>

                                    {!editingGallery?.id && (
                                        <div className="flex mb-6 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg w-fit">
                                            <button
                                                onClick={() => { setIsBatchMode(false); setUploadQueue([]); }}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isBatchMode ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700'}`}
                                            >
                                                Single File
                                            </button>
                                            <button
                                                onClick={() => { setIsBatchMode(true); setUploadQueue([]); }}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isBatchMode ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700'}`}
                                            >
                                                Batch Upload
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
                                                        label="Batch Name Prefix"
                                                        value={editingGallery?.title || ''}
                                                        onChange={v => setEditingGallery(prev => ({ ...prev!, title: v }))}
                                                    />
                                                ) : (
                                                    <Input
                                                        label="Title"
                                                        value={editingGallery?.title || ''}
                                                        onChange={v => setEditingGallery(prev => ({ ...prev!, title: v }))}
                                                    />
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input label="Date" value={editingGallery?.date || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, date: v }))} />
                                                    <Input label="Location" value={editingGallery?.location || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, location: v }))} />
                                                </div>

                                                <TextArea label="Description (Shared)" value={editingGallery?.description || ''} onChange={v => setEditingGallery(prev => ({ ...prev!, description: v }))} />
                                            </div>

                                            <div className="mt-6 flex justify-end gap-3">
                                                <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="px-6 py-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">Cancel</button>
                                                <button
                                                    onClick={handleSaveGallery}
                                                    disabled={!editingGallery?.id && uploadQueue.length === 0 && !manualUrl}
                                                    className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold disabled:opacity-50"
                                                >
                                                    {editingGallery?.id ? 'Update Info' : `Upload ${uploadQueue.length > 0 ? `(${uploadQueue.length})` : ''}`}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {galleryItems.map((item: GalleryItem) => (
                                        <div key={item.id} className="relative group rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 aspect-square">
                                            <AdminImage src={item.type === 'video' ? item.thumbnail : item.url} alt={item.title || ''} className="w-full h-full" containerClassName="w-full h-full" />
                                            {item.type === 'video' && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"><Play size={12} /></div>}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => setEditingGallery(item)} className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteGalleryItem(item.id)} className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs truncate">
                                                {item.title}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'hero' && (
                        <SectionContainer title="Hero Shuffle Grid" onAdd={() => { }}>
                            <div className="mb-6 flex gap-2">
                                <input
                                    className="flex-1 p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                                    placeholder="Paste image URL here..."
                                    value={newHeroImage}
                                    onChange={e => setNewHeroImage(e.target.value)}
                                />
                                <button onClick={handleAddHeroImage} className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 rounded-lg font-bold">Add</button>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                {heroImages.map((img) => (
                                    <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-200 dark:bg-stone-800">
                                        <AdminImage src={img.url} alt="" className="w-full h-full" containerClassName="w-full h-full" />
                                        <button onClick={() => handleRemoveHeroImage(img.id)} className="absolute top-2 right-2 p-1 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </SectionContainer>
                    )}

                    {activeTab === 'data' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 space-y-8">
                            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Life Log Data</h2>
                            <DataSection title="Skills" icon={<Layers size={18} />}>
                                <div className="space-y-3">
                                    {skillData.map((skill, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input value={skill.name} onChange={v => { const n = [...skillData]; if (n[idx]) { n[idx].name = v; updateSkillData(n); } }} />
                                            <div className="w-24"><Input type="number" value={skill.level.toString()} onChange={v => { const n = [...skillData]; if (n[idx]) { n[idx].level = Number(v); updateSkillData(n); } }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </DataSection>

                            <DataSection title="Game Stats (Radar)" icon={<Database size={18} />}>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {gameData.map((g, idx) => (
                                        <div key={idx} className="p-3 border rounded bg-stone-50 dark:bg-stone-900 dark:border-stone-800">
                                            <div className="text-xs font-bold mb-2 text-stone-500">{g.subject}</div>
                                            <Input type="number" label="Value" value={g.A.toString()} onChange={v => { const n = [...gameData]; if (n[idx]) { n[idx].A = Number(v); updateGameData(n); } }} />
                                        </div>
                                    ))}
                                </div>
                            </DataSection>

                            <DataSection title="Weekly Routine (Pie)" icon={<Database size={18} />}>
                                <div className="space-y-3">
                                    {routineData.map((r, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <div className="w-6 h-6 rounded border border-stone-200" style={{ backgroundColor: r.color }}></div>
                                            <Input value={r.name} onChange={v => { const n = [...routineData]; if (n[idx]) { n[idx].name = v; updateRoutineData(n); } }} />
                                            <div className="w-24"><Input type="number" value={r.value.toString()} onChange={v => { const n = [...routineData]; if (n[idx]) { n[idx].value = Number(v); updateRoutineData(n); } }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </DataSection>

                            <DataSection title="Daily Steps" icon={<Database size={18} />}>
                                <div className="grid grid-cols-7 gap-2">
                                    {stepsData.map((s, idx) => (
                                        <div key={idx} className="text-center">
                                            <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                                            <Input type="number" value={s.steps.toString()} onChange={v => { const n = [...stepsData]; if (n[idx]) { n[idx].steps = Number(v); updateStepsData(n); } }} />
                                        </div>
                                    ))}
                                </div>
                            </DataSection>

                            <DataSection title="Photo Stats" icon={<Database size={18} />}>
                                <div className="grid grid-cols-7 gap-2">
                                    {photoStats.map((s, idx) => (
                                        <div key={idx} className="text-center">
                                            <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                                            <Input type="number" value={s.count.toString()} onChange={v => { const n = [...photoStats]; if (n[idx]) { n[idx].count = Number(v); updatePhotoStats(n); } }} />
                                        </div>
                                    ))}
                                </div>
                            </DataSection>

                            <DataSection title="Movies & Series" icon={<Database size={18} />}>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {movieData.map((m, idx) => (
                                        <div key={idx} className="text-center p-2 border rounded dark:border-stone-800">
                                            <div className="text-xs font-bold mb-2">{m.month}</div>
                                            <div className="space-y-1">
                                                <Input type="number" label="Mov" value={m.movies.toString()} onChange={v => { const n = [...movieData]; if (n[idx]) { n[idx].movies = Number(v); updateMovieData(n); } }} />
                                                <Input type="number" label="Ser" value={m.series.toString()} onChange={v => { const n = [...movieData]; if (n[idx]) { n[idx].series = Number(v); updateMovieData(n); } }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DataSection>
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <SectionContainer title="Friends" onAdd={() => setEditingFriend({})}>
                            {editingFriend ? (
                                <EditForm title={editingFriend.id ? 'Edit Friend' : 'New Friend'} onSave={handleSaveFriend} onCancel={() => setEditingFriend(null)}>
                                    <Input label="Name" value={editingFriend.name || ''} onChange={v => setEditingFriend({ ...editingFriend, name: v })} />
                                    <TextArea label="Description" value={editingFriend.description || ''} onChange={v => setEditingFriend({ ...editingFriend, description: v })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Avatar URL" value={editingFriend.avatar || ''} onChange={v => setEditingFriend({ ...editingFriend, avatar: v })} />
                                        <Input label="Cover Image URL" value={editingFriend.cover || ''} onChange={v => setEditingFriend({ ...editingFriend, cover: v })} />
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
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-sage-100 dark:bg-sage-900 text-sage-600 font-bold">
                                                        {f.name.charAt(0)}
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
                                                <ActionBtn onClick={() => setEditingFriend(f)} icon={<Edit2 size={16} />} />
                                                <ActionBtn onClick={() => deleteFriend(f.id)} icon={<Trash2 size={16} />} danger />
                                            </div>
                                        </div>
                                    ))}
                                </ListContainer>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'subscriptions' && (
                        <SectionContainer title="Subscriptions" onAdd={() => setEditingSubscription({})}>
                            {editingSubscription ? (
                                <EditForm title={editingSubscription.id ? 'Edit Subscription' : 'New Subscription'} onSave={handleSaveSubscription} onCancel={() => setEditingSubscription(null)}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Service Name" value={editingSubscription.name || ''} onChange={v => setEditingSubscription({ ...editingSubscription, name: v })} />
                                        <Input label="Category" value={editingSubscription.category || ''} onChange={v => setEditingSubscription({ ...editingSubscription, category: v })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="Price" type="number" value={editingSubscription.price?.toString() || ''} onChange={v => setEditingSubscription({ ...editingSubscription, price: Number(v) })} />
                                        <Input label="Currency" value={editingSubscription.currency || ''} onChange={v => setEditingSubscription({ ...editingSubscription, currency: v as any })} />
                                        <Input label="Cycle" value={editingSubscription.cycle || ''} onChange={v => setEditingSubscription({ ...editingSubscription, cycle: v as any })} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" checked={editingSubscription.active || false} onChange={e => setEditingSubscription({ ...editingSubscription, active: e.target.checked })} />
                                        <label className="text-sm">Active Subscription</label>
                                    </div>
                                </EditForm>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Monthly Total</div>
                                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                                ¥{subscriptions.filter(s => s.active && s.cycle === 'monthly').reduce((acc, s) => acc + convertCurrency(s.price, s.currency), 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Yearly Total</div>
                                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                                ¥{subscriptions.filter(s => s.active).reduce((acc, s) => {
                                                    const monthly = s.cycle === 'monthly' ? s.price : s.price / 12;
                                                    return acc + convertCurrency(monthly * 12, s.currency);
                                                }, 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <ListContainer>
                                        {subscriptions.map(s => (
                                            <div key={s.id} className={`bg-white dark:bg-stone-900 p-4 rounded-xl border ${s.active ? 'border-stone-200 dark:border-stone-800' : 'border-stone-100 dark:border-stone-800 opacity-60'} flex items-center justify-between`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${s.active ? 'bg-stone-100 dark:bg-stone-800 text-stone-600' : 'bg-stone-50 text-stone-400'}`}>
                                                        <CreditCard size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-stone-900 dark:text-stone-100">{s.name}</h3>
                                                        <p className="text-xs text-stone-500">{s.category} • {s.cycle}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="font-bold text-stone-900 dark:text-stone-100">{s.currency} {s.price}</div>
                                                        <div className="text-xs text-stone-400">≈ ¥{convertCurrency(s.price, s.currency).toFixed(0)}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <ActionBtn onClick={() => setEditingSubscription(s)} icon={<Edit2 size={16} />} />
                                                        <ActionBtn onClick={() => deleteSubscription(s.id)} icon={<Trash2 size={16} />} danger />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </ListContainer>
                                </div>
                            )}
                        </SectionContainer>
                    )}

                    {activeTab === 'credentials' && (
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

                                    {syncJobs.length > 0 && (
                                        <div className="bg-stone-900 text-stone-300 p-4 rounded-xl font-mono text-xs max-h-60 overflow-y-auto">
                                            <div className="flex items-center gap-2 mb-2 text-stone-500 uppercase font-bold tracking-wider">
                                                <Terminal size={12} /> Sync Logs
                                            </div>
                                            {syncJobs.map(job => (
                                                <div key={job.id} className="mb-4 border-b border-stone-800 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex justify-between text-stone-500 mb-1">
                                                        <span>Job: {job.id} ({job.platform})</span>
                                                        <span className={job.status === 'success' ? 'text-emerald-500' : job.status === 'failed' ? 'text-rose-500' : 'text-blue-500'}>{job.status}</span>
                                                    </div>
                                                    {job.logs.map((log, i) => (
                                                        <div key={i} className="pl-2 border-l-2 border-stone-800">{log}</div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </SectionContainer>
                    )}

                </div>
            </main >
        </div >
    );
};

export default AdminDashboard;
