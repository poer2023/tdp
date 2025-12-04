"use client";

import React from 'react';
import {
    FileText, Image as ImageIcon, Database,
    Plus, Trash2, Edit2, X,
    Briefcase, Camera,
    Home, UploadCloud, FileImage, Check,
    Activity, Clock, TrendingUp, PieChart as PieIcon,
    ShieldCheck, Globe, Calendar, Tag, Heart, MessageCircle,
    Users, MousePointer, Smartphone, ArrowUpRight, ArrowDownRight,
    Eye, Key, CreditCard, RefreshCw, Shield, AlertTriangle, Terminal,
    Coins, ArrowRightLeft, UserPlus, ExternalLink, Copy
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, CartesianGrid, PieChart, Pie
} from 'recharts';
import type { BlogPost, Moment, MomentImage, Project, ShareItem, GalleryItem, TrafficData, SourceData, PageVisitData, DeviceData, Tab } from './types';

// Helper to get image URL from string or MomentImage
const getImageUrl = (img: string | MomentImage): string => {
    if (typeof img === 'string') return img;
    return img.url;
};

// --- Helper Components ---

export const ImageUploadArea: React.FC<{
    queue: { file: File, preview: string }[],
    onDrop: (e: React.DragEvent) => void,
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: (idx: number) => void,
    isDragOver: boolean,
    setIsDragOver: (v: boolean) => void,
    multiple: boolean,
    currentImageUrl?: string,
    existingImages?: (string | MomentImage)[],
    onRemoveExisting?: (idx: number) => void,
    manualUrl: string,
    setManualUrl: (v: string) => void
}> = ({ queue, onDrop, onFileSelect, onRemove, isDragOver, setIsDragOver, multiple, currentImageUrl, existingImages, onRemoveExisting, manualUrl, setManualUrl }) => {
    return (
        <div className="space-y-4">
            <div
                className={`
                    border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 transition-colors cursor-pointer relative min-h-[160px]
                    ${isDragOver ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/20' : 'border-stone-300 dark:border-stone-700 hover:border-sage-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    multiple={multiple}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={onFileSelect}
                    accept="image/*"
                />

                {queue.length === 0 && !currentImageUrl && (!existingImages || existingImages.length === 0) ? (
                    <>
                        <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-500 mb-3 pointer-events-none">
                            <UploadCloud size={20} />
                        </div>
                        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 pointer-events-none">
                            {multiple ? "Drag multiple photos" : "Drag cover photo"}
                        </p>
                        <p className="text-xs text-stone-400 mt-1 pointer-events-none">
                            JPG, PNG, WebP supported
                        </p>
                    </>
                ) : (
                    <div className="text-sm text-stone-400">
                        {multiple ? "Drag to add more" : "Drag to replace"}
                    </div>
                )}
            </div>

            <div className="flex gap-2 items-center">
                <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                <span className="text-[10px] text-stone-400 font-bold uppercase">OR</span>
                <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
            </div>
            <Input
                value={manualUrl}
                onChange={setManualUrl}
                label={manualUrl ? "Image URL to save" : undefined}
                type="text"
            />

            <div className={`grid gap-2 ${multiple ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {currentImageUrl && queue.length === 0 && (
                    <div className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <img src={currentImageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Current Cover
                        </div>
                    </div>
                )}

                {existingImages && existingImages.map((img, idx) => (
                    <div key={`exist-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                        {onRemoveExisting && (
                            <button
                                onClick={() => onRemoveExisting(idx)}
                                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                                <X size={12} />
                            </button>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 truncate text-center">
                            Saved
                        </div>
                    </div>
                ))}

                {queue.map((item, idx) => (
                    <div key={`queue-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-sage-500 shadow-md">
                        <img src={item.preview} className="w-full h-full object-cover" />
                        <button
                            onClick={() => onRemove(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                            <X size={12} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-sage-600 text-white text-[9px] p-1 truncate text-center">
                            Ready to Upload
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const RichPostItem: React.FC<{ post: BlogPost, onEdit: () => void, onDelete: () => void }> = ({ post, onEdit, onDelete }) => (
    <div className="group bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex gap-4 transition-all hover:border-stone-300 dark:hover:border-stone-600">
        <div className="w-24 h-24 flex-shrink-0 bg-stone-200 dark:bg-stone-800 rounded-lg overflow-hidden relative">
            {post.imageUrl ? (
                <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <FileText size={24} />
                </div>
            )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sage-600 bg-sage-50 dark:text-sage-400 dark:bg-sage-900/30 px-2 py-0.5 rounded-full">
                        {post.category}
                    </span>
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar size={10} /> {post.date}
                    </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 truncate">{post.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{post.excerpt}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-400 mt-2">
                <div className="flex items-center gap-1"><Heart size={12} /> {post.likes}</div>
                <div className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments?.length || 0}</div>
                {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                        <Tag size={12} /> {post.tags[0]} {post.tags.length > 1 && `+${post.tags.length - 1}`}
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col justify-center gap-2 border-l border-stone-100 dark:border-stone-800 pl-4 ml-2">
            <ActionBtn onClick={onEdit} icon={<Edit2 size={16} />} />
            <ActionBtn onClick={onDelete} icon={<Trash2 size={16} />} danger />
        </div>
    </div>
);

export const RichMomentItem: React.FC<{ moment: Moment, onEdit: () => void, onDelete: () => void }> = ({ moment, onEdit, onDelete }) => (
    <div className="group bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 transition-all hover:border-stone-300 dark:hover:border-stone-600">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-stone-400">{moment.date}</div>
                {moment.tags && moment.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
            </div>
            <div className="flex gap-2">
                <ActionBtn onClick={onEdit} icon={<Edit2 size={14} />} />
                <ActionBtn onClick={onDelete} icon={<Trash2 size={14} />} danger />
            </div>
        </div>
        <p className="text-stone-800 dark:text-stone-200 text-sm mb-3 line-clamp-3 font-serif">
            {moment.content}
        </p>
        {moment.images && moment.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
                {moment.images.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                        <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const NavBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${active ? 'bg-sage-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
    >
        {icon} <span>{label}</span>
    </button>
);

export const SectionContainer: React.FC<{ title: string, children: React.ReactNode, onAdd: () => void }> = ({ title, children, onAdd }) => (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{title}</h2>
            <button
                onClick={onAdd}
                className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 font-medium text-sm transition-opacity"
            >
                <Plus size={16} /> Add New
            </button>
        </div>
        {children}
    </div>
);

export const ListContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid gap-3">{children}</div>
);

export const ListItem: React.FC<{ title: string, subtitle?: string, image?: string, onEdit: () => void, onDelete: () => void }> = ({ title, subtitle, image, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-4 transition-colors">
        {image && <img src={image} className="w-10 h-10 rounded object-cover bg-stone-200" />}
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
            <ActionBtn onClick={onEdit} icon={<Edit2 size={16} />} />
            <ActionBtn onClick={onDelete} icon={<Trash2 size={16} />} danger />
        </div>
    </div>
);

export const ActionBtn: React.FC<{ onClick: () => void, icon: React.ReactNode, danger?: boolean }> = ({ onClick, icon, danger }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors ${danger ? 'text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
    >
        {icon}
    </button>
);

export const EditForm: React.FC<{ title: string, children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ title, children, onSave, onCancel }) => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex justify-between items-center mb-6 border-b border-stone-100 dark:border-stone-800 pb-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h3>
            <button onClick={onCancel} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
            {children}
        </div>
        <div className="flex gap-3 pt-6 mt-2 border-t border-stone-100 dark:border-stone-800">
            <button onClick={onSave} className="flex-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2.5 rounded-lg font-bold hover:opacity-90">Save Changes</button>
            <button onClick={onCancel} className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-700">Cancel</button>
        </div>
    </div>
);

export const Input: React.FC<{ label?: string, value?: string, onChange: (val: string) => void, type?: string }> = ({ label, value, onChange, type = "text" }) => (
    <div>
        {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{label}</label>}
        <input
            type={type}
            className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export const TextArea: React.FC<{ label?: string, value?: string, onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div>
        {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{label}</label>}
        <textarea
            className="w-full p-3 border rounded-lg h-32 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm resize-none"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export const DataSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-stone-800 dark:text-stone-200 pb-4 border-b border-stone-100 dark:border-stone-800">
            {icon} {title}
        </h3>
        {children}
    </div>
);

export const OverviewSection: React.FC<{
    posts: BlogPost[],
    moments: Moment[],
    galleryItems: GalleryItem[],
    projects: Project[],
    shareItems: ShareItem[],
    onQuickAction: (tab: Tab) => void
}> = ({ posts, moments, galleryItems, projects, shareItems, onQuickAction }) => {
    const stats = [
        { label: 'Articles', value: posts.length, icon: FileText, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
        { label: 'Moments', value: moments.length, icon: ImageIcon, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
        { label: 'Photos', value: galleryItems.length, icon: Camera, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
        { label: 'Projects', value: projects.length, icon: Briefcase, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
    ];

    const chartData = [
        { name: 'Articles', count: posts.length },
        { name: 'Moments', count: moments.length },
        { name: 'Photos', count: galleryItems.length },
        { name: 'Projects', count: projects.length },
    ];

    const recentActivity = [
        ...posts.slice(0, 2).map(p => ({ type: 'Article', title: p.title, date: p.date, icon: FileText })),
        ...moments.slice(0, 2).map(m => ({ type: 'Moment', title: m.content.substring(0, 30) + '...', date: m.date, icon: ImageIcon })),
    ].slice(0, 4);

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Dashboard Overview</h2>
                    <p className="text-stone-500 dark:text-stone-400">Welcome back. Here is what&apos;s happening today.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => onQuickAction('posts')} className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                        New Article
                    </button>
                    <button onClick={() => onQuickAction('moments')} className="px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
                        New Moment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                            <PieIcon size={18} /> Content Distribution
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1c1917', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#44403c" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#a855f7', '#10b981'][index % 4]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                            <Clock size={18} /> Recent Items
                        </h3>
                        <div className="space-y-4">
                            {recentActivity.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0">
                                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded text-stone-500">
                                        <item.icon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{item.title}</div>
                                        <div className="text-xs text-stone-400">{item.type} • {item.date}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                            <ShieldCheck size={18} /> System Status
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2"><Globe size={14} /> Website</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><Check size={12} /> Live</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2"><Database size={14} /> Database</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><Check size={12} /> Connected</span>
                            </div>
                            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-500 w-full h-full rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-stone-400 text-center mt-1">All systems operational</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TrafficStatsSection: React.FC<{
    trafficData: TrafficData[],
    sourceData: SourceData[],
    pageVisitData: PageVisitData[],
    deviceData: DeviceData[]
}> = ({ trafficData, sourceData, pageVisitData, deviceData }) => {
    const totalVisits = trafficData.reduce((acc, curr) => acc + curr.visits, 0);
    const totalUnique = trafficData.reduce((acc, curr) => acc + curr.unique, 0);

    const kpiCards = [
        { label: 'Total Visits (30d)', value: totalVisits.toLocaleString(), change: '+12.5%', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Unique Visitors', value: totalUnique.toLocaleString(), change: '+8.2%', icon: MousePointer, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Avg. Duration', value: '2m 45s', change: '-1.2%', icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Bounce Rate', value: '42.3%', change: '-0.5%', icon: Activity, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    ];

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
            <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Traffic Analytics</h2>
                <p className="text-stone-500 dark:text-stone-400">Insights into your audience growth and behavior.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${kpi.color}`}>
                                <kpi.icon size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                                {kpi.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{kpi.value}</h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                        <TrendingUp size={18} /> Traffic Overview
                    </h3>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} opacity={0.5} />
                            <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                            <Area type="monotone" dataKey="unique" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorUnique)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-2">
                        <Globe size={18} /> Acquisition
                    </h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-2">
                        <FileText size={18} /> Top Pages
                    </h3>
                    <div className="space-y-4">
                        {pageVisitData.map((page, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-500">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{page.title}</div>
                                        <div className="text-xs text-stone-400 truncate">{page.path}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 text-sm font-mono">
                                    <Eye size={14} /> {page.visits.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-2">
                    <Smartphone size={18} /> Device Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {deviceData.map((device, idx) => (
                        <div key={idx} className="flex flex-col items-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                            <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">{device.name}</div>
                            <div className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2">{device.value}%</div>
                            <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${device.value}%`, backgroundColor: device.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
