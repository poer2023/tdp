
import React, { useState, useCallback, useRef } from 'react';
import { useData, useAuth, useSettings } from '../store';
import { BlogPost, Moment, Project, ShareItem, GalleryItem, TrafficData, SourceData, PageVisitData, DeviceData, Friend, Subscription, Credential, SyncJob } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Image as ImageIcon, Database, 
  LogOut, Plus, Trash2, Edit2, Menu, X, 
  Briefcase, Link2, Camera, Layers, Play,
  LayoutTemplate, Home, UploadCloud, FileImage, Check,
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

type Tab = 'overview' | 'stats' | 'posts' | 'moments' | 'projects' | 'curated' | 'gallery' | 'hero' | 'data' | 'friends' | 'subscriptions' | 'credentials';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const { 
    // Content
    posts, addPost, updatePost, deletePost,
    moments, addMoment, updateMoment, deleteMoment,
    projects, addProject, updateProject, deleteProject,
    shareItems, addShareItem, updateShareItem, deleteShareItem,
    galleryItems, addGalleryItem, updateGalleryItem, deleteGalleryItem,
    
    // Data
    movieData, updateMovieData,
    skillData, updateSkillData,
    gameData, updateGameData,
    routineData, updateRoutineData,
    stepsData, updateStepsData,
    photoStats, updatePhotoStats,
    heroImages, updateHeroImages,
    trafficData, sourceData, pageVisitData, deviceData,

    // New Modules
    friends, addFriend, updateFriend, deleteFriend,
    subscriptions, addSubscription, updateSubscription, deleteSubscription,
    credentials, addCredential, updateCredential, deleteCredential, triggerSync,
    syncJobs, convertCurrency
  } = useData();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit States
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [editingMoment, setEditingMoment] = useState<Partial<Moment> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingShare, setEditingShare] = useState<Partial<ShareItem> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [editingFriend, setEditingFriend] = useState<Partial<Friend> | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription> | null>(null);
  const [editingCredential, setEditingCredential] = useState<Partial<Credential> | null>(null);

  const [newHeroImage, setNewHeroImage] = useState('');

  // Universal Upload State
  const [uploadQueue, setUploadQueue] = useState<{file: File, preview: string}[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [syncingCreds, setSyncingCreds] = useState<Set<string>>(new Set());


  // --- Helpers ---
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const closeSidebar = () => setIsSidebarOpen(false);

  // --- Generic File Processor ---
  const processFiles = async (queue: {file: File}[]): Promise<string[]> => {
      const results: string[] = [];
      for (const item of queue) {
          const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(item.file);
          });
          results.push(base64);
      }
      return results;
  };

  // --- Save Handlers (Abbreviated for brevity where unchanged) ---
  const handleSavePost = async () => { /* ... */
    if (!editingPost?.title) return;
    let finalImageUrl = editingPost.imageUrl || '';
    if (uploadQueue.length > 0) {
        const uploadedUrls = await processFiles(uploadQueue);
        finalImageUrl = uploadedUrls[0];
    } else if (manualUrl) {
        finalImageUrl = manualUrl;
    }
    const newPost: BlogPost = {
      id: editingPost.id || generateId(),
      title: editingPost.title || '',
      excerpt: editingPost.excerpt || '',
      category: editingPost.category || 'Life',
      date: editingPost.date || new Date().toLocaleDateString(),
      readTime: editingPost.readTime || '5 min read',
      imageUrl: finalImageUrl,
      tags: editingPost.tags || [],
      type: 'article',
      likes: editingPost.likes || 0,
      comments: editingPost.comments || []
    };
    editingPost.id ? updatePost(newPost) : addPost(newPost);
    setEditingPost(null);
    setUploadQueue([]);
    setManualUrl('');
  };

  const handleSaveMoment = async () => { /* ... */ 
    if (!editingMoment?.content) return;
    const existingImages = editingMoment.images || [];
    let newImages: string[] = [];
    if (uploadQueue.length > 0) {
        newImages = await processFiles(uploadQueue);
    }
    if (manualUrl) {
        newImages.push(manualUrl);
    }
    const finalImages = [...existingImages, ...newImages];
    const newMoment: Moment = {
      id: editingMoment.id || generateId(),
      content: editingMoment.content || '',
      date: editingMoment.date || 'Just now',
      images: finalImages,
      tags: editingMoment.tags || [],
      type: 'moment',
      likes: editingMoment.likes || 0,
      comments: editingMoment.comments || []
    };
    editingMoment.id ? updateMoment(newMoment) : addMoment(newMoment);
    setEditingMoment(null);
    setUploadQueue([]);
    setManualUrl('');
  };

  const handleSaveProject = () => { /* ... */
    if (!editingProject?.title) return;
    const newProject: Project = {
      id: editingProject.id || generateId(),
      title: editingProject.title || '',
      description: editingProject.description || '',
      imageUrl: editingProject.imageUrl || '',
      technologies: editingProject.technologies || [],
      demoUrl: editingProject.demoUrl,
      repoUrl: editingProject.repoUrl,
      date: editingProject.date || '2023',
      role: editingProject.role || 'Developer',
      year: editingProject.year || new Date().getFullYear().toString(),
      features: editingProject.features || [],
      stats: editingProject.stats || []
    };
    editingProject.id ? updateProject(newProject) : addProject(newProject);
    setEditingProject(null);
  };

  const handleSaveShare = () => { /* ... */
    if (!editingShare?.title) return;
    const newShare: ShareItem = {
      id: editingShare.id || generateId(),
      title: editingShare.title || '',
      description: editingShare.description || '',
      url: editingShare.url || '',
      domain: editingShare.domain || new URL(editingShare.url || 'https://example.com').hostname,
      imageUrl: editingShare.imageUrl,
      date: editingShare.date || 'Just now',
      tags: editingShare.tags || [],
      type: 'share',
      likes: editingShare.likes || 0
    };
    editingShare.id ? updateShareItem(newShare) : addShareItem(newShare);
    setEditingShare(null);
  };

  const handleSaveGallery = async () => { /* ... */
    if (editingGallery?.id && uploadQueue.length === 0) {
         const newGallery: GalleryItem = {
            id: editingGallery.id,
            type: editingGallery.type || 'image',
            url: editingGallery.url || '',
            thumbnail: editingGallery.thumbnail,
            title: editingGallery.title || 'Untitled',
            description: editingGallery.description,
            date: editingGallery.date || new Date().toISOString().split('T')[0],
            location: editingGallery.location,
            exif: editingGallery.exif 
         };
         updateGalleryItem(newGallery);
         setEditingGallery(null);
         return;
    }

    if (uploadQueue.length > 0) {
        const uploadedUrls = await processFiles(uploadQueue);
        for (let i = 0; i < uploadQueue.length; i++) {
            const { file } = uploadQueue[i];
            const base64Url = uploadedUrls[i];
            let title = editingGallery?.title || 'Untitled';
            if (isBatchMode && uploadQueue.length > 1) {
                title = `${title} ${String(i + 1).padStart(2, '0')}`;
            }
            const newGallery: GalleryItem = {
                id: generateId(),
                type: file.type.startsWith('video') ? 'video' : 'image',
                url: base64Url,
                title: title,
                description: editingGallery?.description,
                date: editingGallery?.date || new Date().toISOString().split('T')[0],
                location: editingGallery?.location,
                exif: !file.type.startsWith('video') ? {
                    camera: 'Auto-detected',
                    lens: '-',
                    aperture: '-',
                    iso: '-',
                    shutter: '-'
                } : undefined
            };
            addGalleryItem(newGallery);
        }
        setEditingGallery(null);
        setUploadQueue([]);
    } else {
        if (!editingGallery?.url) return;
        const newGallery: GalleryItem = {
            id: generateId(),
            type: editingGallery.type || 'image',
            url: editingGallery.url || '',
            thumbnail: editingGallery.thumbnail,
            title: editingGallery.title || 'Untitled',
            description: editingGallery.description,
            date: editingGallery.date || new Date().toISOString().split('T')[0],
            location: editingGallery.location,
            exif: editingGallery.exif
        };
        addGalleryItem(newGallery);
        setEditingGallery(null);
    }
  };

  const handleSaveFriend = () => {
      if(!editingFriend?.name) return;
      const newFriend: Friend = {
          id: editingFriend.id || generateId(),
          name: editingFriend.name,
          accessCode: editingFriend.accessCode || Math.random().toString(36).substr(2, 6).toUpperCase(),
          note: editingFriend.note || '',
          tags: editingFriend.tags || [],
          status: editingFriend.status || 'active',
          validUntil: editingFriend.validUntil,
          createdAt: editingFriend.createdAt || new Date().toISOString().split('T')[0]
      };
      editingFriend.id ? updateFriend(newFriend) : addFriend(newFriend);
      setEditingFriend(null);
  };

  const handleSaveSubscription = () => { /* ... */
      if(!editingSubscription?.name || !editingSubscription.price) return;
      const newSub: Subscription = {
          id: editingSubscription.id || generateId(),
          name: editingSubscription.name,
          price: Number(editingSubscription.price),
          currency: editingSubscription.currency || 'USD',
          cycle: editingSubscription.cycle || 'monthly',
          category: editingSubscription.category || 'Software',
          active: editingSubscription.active ?? true,
          description: editingSubscription.description,
          nextBilling: editingSubscription.nextBilling
      };
      editingSubscription.id ? updateSubscription(newSub) : addSubscription(newSub);
      setEditingSubscription(null);
  };

  const handleSaveCredential = () => { /* ... */
      if(!editingCredential?.name || !editingCredential.platform) return;
      const newCred: Credential = {
          id: editingCredential.id || generateId(),
          platform: editingCredential.platform,
          name: editingCredential.name,
          identifier: editingCredential.identifier || '',
          type: editingCredential.type || 'cookie',
          status: editingCredential.status || 'active',
          failureCount: editingCredential.failureCount || 0,
          lastSync: editingCredential.lastSync
      };
      editingCredential.id ? updateCredential(newCred) : addCredential(newCred);
      setEditingCredential(null);
  }

  const handleSyncCredential = async (id: string) => {
      setSyncingCreds(prev => new Set(prev).add(id));
      await triggerSync(id);
      setSyncingCreds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
  };


  const handleAddHeroImage = () => {
      if(newHeroImage) {
          updateHeroImages([...heroImages, newHeroImage]);
          setNewHeroImage('');
      }
  };
  const handleRemoveHeroImage = (index: number) => {
      const newImages = [...heroImages];
      newImages.splice(index, 1);
      updateHeroImages(newImages);
  };

  // --- Drag & Drop Logic ---
  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
          const newQueue = files.map((file: File) => ({
              file,
              preview: URL.createObjectURL(file)
          }));
          const shouldAppend = (activeTab === 'gallery' && isBatchMode) || activeTab === 'moments';
          
          setUploadQueue(prev => shouldAppend ? [...prev, ...newQueue] : [newQueue[0]]);
      }
  }, [isBatchMode, activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
           const files = Array.from(e.target.files);
           const newQueue = files.map((file: File) => ({
              file,
              preview: URL.createObjectURL(file)
          }));
          const shouldAppend = (activeTab === 'gallery' && isBatchMode) || activeTab === 'moments';
          setUploadQueue(prev => shouldAppend ? [...prev, ...newQueue] : [newQueue[0]]);
      }
  };

  const removeFileFromQueue = (index: number) => {
      setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 dark:bg-black z-30 flex items-center justify-between px-4 shadow-md">
         <h1 className="font-serif text-xl text-white">CMS</h1>
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in"
            onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 dark:bg-black text-stone-300 flex flex-col h-full
        transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 overflow-y-auto
      `}>
        {/* ... Sidebar content identical to before ... */}
        <div className="p-6 hidden md:block">
          <h1 className="font-serif text-xl text-white">Lumina CMS</h1>
        </div>
        <div className="h-16 md:hidden"></div>
        
        <nav className="flex-1 px-3 space-y-8 mt-4 md:mt-0">
          
          {/* Quick Actions */}
          <div>
            <div className="space-y-1">
                 <NavBtn active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); closeSidebar(); }} icon={<Activity size={18} />} label="Overview" />
                 <NavBtn active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); closeSidebar(); }} icon={<TrendingUp size={18} />} label="Traffic Stats" />
                 <NavBtn active={false} onClick={() => navigate('/')} icon={<Home size={18} />} label="Back to Home" />
            </div>
          </div>

          {/* CONTENT GROUP */}
          <div>
            <div className="px-4 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Content</div>
            <div className="space-y-1">
                <NavBtn active={activeTab === 'posts'} onClick={() => { setActiveTab('posts'); closeSidebar(); }} icon={<FileText size={18} />} label="Articles" />
                <NavBtn active={activeTab === 'moments'} onClick={() => { setActiveTab('moments'); closeSidebar(); }} icon={<ImageIcon size={18} />} label="Moments" />
                <NavBtn active={activeTab === 'curated'} onClick={() => { setActiveTab('curated'); closeSidebar(); }} icon={<Link2 size={18} />} label="Curated" />
                <NavBtn active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); closeSidebar(); }} icon={<Briefcase size={18} />} label="Projects" />
            </div>
          </div>

          {/* ADMIN GROUP (NEW) */}
           <div>
            <div className="px-4 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Management</div>
            <div className="space-y-1">
                <NavBtn active={activeTab === 'friends'} onClick={() => { setActiveTab('friends'); closeSidebar(); }} icon={<Users size={18} />} label="Friends" />
                <NavBtn active={activeTab === 'subscriptions'} onClick={() => { setActiveTab('subscriptions'); closeSidebar(); }} icon={<CreditCard size={18} />} label="Subscriptions" />
                <NavBtn active={activeTab === 'credentials'} onClick={() => { setActiveTab('credentials'); closeSidebar(); }} icon={<Key size={18} />} label="Credentials" />
            </div>
          </div>

          {/* MEDIA GROUP */}
          <div>
             <div className="px-4 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Media</div>
             <div className="space-y-1">
                <NavBtn active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); closeSidebar(); }} icon={<Camera size={18} />} label="Gallery" />
                <NavBtn active={activeTab === 'hero'} onClick={() => { setActiveTab('hero'); closeSidebar(); }} icon={<LayoutTemplate size={18} />} label="Hero Images" />
             </div>
          </div>

          {/* DATA GROUP */}
          <div>
             <div className="px-4 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Quantified Self</div>
             <div className="space-y-1">
                <NavBtn active={activeTab === 'data'} onClick={() => { setActiveTab('data'); closeSidebar(); }} icon={<Database size={18} />} label="Life Log Data" />
             </div>
          </div>

        </nav>

        <div className="p-4 border-t border-stone-800 bg-stone-900 dark:bg-black">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center font-bold text-white text-xs">
                    {user?.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{user?.username}</div>
                    <div className="text-xs text-stone-500 uppercase">{user?.role}</div>
                </div>
            </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} /> {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        min-h-screen transition-all duration-300
        pt-20 p-4 md:pt-8 md:p-8 md:ml-64
      `}>

        {/* --- OVERVIEW --- */}
        {activeTab === 'overview' && (
            <OverviewSection 
                posts={posts} 
                moments={moments} 
                galleryItems={galleryItems} 
                projects={projects} 
                shareItems={shareItems}
                onQuickAction={(tab) => setActiveTab(tab)}
            />
        )}
        
        {/* --- TRAFFIC STATS --- */}
        {activeTab === 'stats' && (
            <TrafficStatsSection 
                trafficData={trafficData}
                sourceData={sourceData}
                pageVisitData={pageVisitData}
                deviceData={deviceData}
            />
        )}
        
        {/* --- FRIENDS (UPDATED CARD LAYOUT) --- */}
        {activeTab === 'friends' && (
            <SectionContainer title="Friends Management" onAdd={() => setEditingFriend({})}>
                {editingFriend ? (
                    <EditForm title={editingFriend.id ? 'Edit Friend' : 'Invite Friend'} onSave={handleSaveFriend} onCancel={() => setEditingFriend(null)}>
                         <div className="grid grid-cols-2 gap-4">
                             <Input label="Name" value={editingFriend.name} onChange={v => setEditingFriend({...editingFriend, name: v})} />
                             <Input label="Access Code" value={editingFriend.accessCode} onChange={v => setEditingFriend({...editingFriend, accessCode: v})} />
                         </div>
                         <Input label="Tags (Comma separated)" value={editingFriend.tags?.join(', ')} onChange={v => setEditingFriend({...editingFriend, tags: v.split(',').map(s => s.trim())})} />
                         <Input label="Note" value={editingFriend.note} onChange={v => setEditingFriend({...editingFriend, note: v})} />
                         <div className="grid grid-cols-2 gap-4">
                             <Input label="Valid Until" type="date" value={editingFriend.validUntil} onChange={v => setEditingFriend({...editingFriend, validUntil: v})} />
                             <div className="pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editingFriend.status !== 'banned'} onChange={e => setEditingFriend({...editingFriend, status: e.target.checked ? 'active' : 'banned'})} className="w-4 h-4 accent-sage-600" />
                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Active Status</span>
                                </label>
                             </div>
                         </div>
                    </EditForm>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {friends.map(f => (
                            <div key={f.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Users size={100} />
                                </div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 text-lg">
                                        {f.name[0]}
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${f.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {f.status}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">{f.name}</h3>
                                <div className="text-xs text-stone-500 mb-4 font-mono">Code: {f.accessCode}</div>
                                
                                {f.note && (
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2 min-h-[40px]">
                                        "{f.note}"
                                    </p>
                                )}

                                <div className="flex gap-2 mb-6">
                                    {f.tags.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 text-[10px] rounded-full">{t}</span>
                                    ))}
                                </div>
                                
                                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center gap-2">
                                     <button 
                                        onClick={() => window.open(`#/friends/${f.accessCode}`, '_blank')}
                                        className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-2 rounded hover:opacity-90 transition-opacity"
                                     >
                                        Visit Room <ExternalLink size={12} />
                                     </button>
                                     <div className="flex gap-1">
                                         <button onClick={() => setEditingFriend(f)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"><Edit2 size={16} /></button>
                                         <button onClick={() => deleteFriend(f.id)} className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={16} /></button>
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionContainer>
        )}

        {/* ... Other Tabs (Subscriptions, Credentials, Posts, etc.) remain mostly unchanged but included in full file ... */}
        {/* --- SUBSCRIPTIONS --- */}
        {activeTab === 'subscriptions' && (
            <SectionContainer title="Subscription Tracker" onAdd={() => setEditingSubscription({})}>
                {/* ... existing code ... */}
                {editingSubscription ? (
                    <EditForm title={editingSubscription.id ? 'Edit Subscription' : 'New Subscription'} onSave={handleSaveSubscription} onCancel={() => setEditingSubscription(null)}>
                         {/* ... existing form ... */}
                         <div className="grid grid-cols-2 gap-4">
                             <Input label="Service Name" value={editingSubscription.name} onChange={v => setEditingSubscription({...editingSubscription, name: v})} />
                             <Input label="Category" value={editingSubscription.category} onChange={v => setEditingSubscription({...editingSubscription, category: v})} />
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                             <Input label="Price" type="number" value={editingSubscription.price?.toString()} onChange={v => setEditingSubscription({...editingSubscription, price: Number(v)})} />
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Currency</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                                    value={editingSubscription.currency}
                                    onChange={e => setEditingSubscription({...editingSubscription, currency: e.target.value as any})}
                                 >
                                     <option value="CNY">CNY</option>
                                     <option value="USD">USD</option>
                                     <option value="JPY">JPY</option>
                                     <option value="HKD">HKD</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Cycle</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                                    value={editingSubscription.cycle}
                                    onChange={e => setEditingSubscription({...editingSubscription, cycle: e.target.value as any})}
                                 >
                                     <option value="monthly">Monthly</option>
                                     <option value="yearly">Yearly</option>
                                     <option value="one-time">One Time</option>
                                 </select>
                             </div>
                         </div>
                         <Input label="Next Billing Date" type="date" value={editingSubscription.nextBilling} onChange={v => setEditingSubscription({...editingSubscription, nextBilling: v})} />
                         <div className="pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={editingSubscription.active ?? true} onChange={e => setEditingSubscription({...editingSubscription, active: e.target.checked})} className="w-4 h-4 accent-sage-600" />
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Active Subscription</span>
                            </label>
                        </div>
                    </EditForm>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className={`p-5 rounded-xl border ${sub.active ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800' : 'bg-stone-50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 opacity-75'} relative group`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 font-bold text-lg">
                                        {sub.name[0]}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-lg text-stone-900 dark:text-stone-100">
                                            {sub.currency === 'USD' ? '$' : sub.currency === 'JPY' ? '¥' : '¥'}
                                            {sub.price}
                                        </div>
                                        <div className="text-xs text-stone-400 uppercase">{sub.cycle}</div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-stone-800 dark:text-stone-200">{sub.name}</h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{sub.category}</p>
                                
                                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs text-stone-400">
                                    <span>Next: {sub.nextBilling || 'N/A'}</span>
                                    {!sub.active && <span className="text-rose-500 font-bold">INACTIVE</span>}
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                     <button onClick={() => setEditingSubscription(sub)} className="p-1.5 bg-stone-100 hover:bg-white rounded shadow text-stone-600"><Edit2 size={14} /></button>
                                     <button onClick={() => deleteSubscription(sub.id)} className="p-1.5 bg-rose-100 hover:bg-rose-200 rounded shadow text-rose-600"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionContainer>
        )}

        {/* --- CREDENTIALS & SYNC --- */}
        {activeTab === 'credentials' && (
            <SectionContainer title="Credentials Vault" onAdd={() => setEditingCredential({})}>
                {editingCredential ? (
                     <EditForm title={editingCredential.id ? 'Edit Credential' : 'Add Credential'} onSave={handleSaveCredential} onCancel={() => setEditingCredential(null)}>
                         <Input label="Friendly Name" value={editingCredential.name} onChange={v => setEditingCredential({...editingCredential, name: v})} />
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Platform</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                                    value={editingCredential.platform}
                                    onChange={e => setEditingCredential({...editingCredential, platform: e.target.value as any})}
                                 >
                                     <option value="Bilibili">Bilibili</option>
                                     <option value="Douban">Douban</option>
                                     <option value="Steam">Steam</option>
                                     <option value="GitHub">GitHub</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Type</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                                    value={editingCredential.type}
                                    onChange={e => setEditingCredential({...editingCredential, type: e.target.value as any})}
                                 >
                                     <option value="cookie">Cookie</option>
                                     <option value="token">Token</option>
                                     <option value="api_key">API Key</option>
                                 </select>
                             </div>
                         </div>
                         <TextArea label="Secret / Identifier (Encrypted on save)" value={editingCredential.identifier} onChange={v => setEditingCredential({...editingCredential, identifier: v})} />
                     </EditForm>
                ) : (
                    <div className="space-y-6">
                        {/* Credential List */}
                        <div className="grid gap-3">
                            {credentials.map(cred => (
                                <div key={cred.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm
                                            ${cred.platform === 'Bilibili' ? 'bg-pink-400' : 
                                              cred.platform === 'Steam' ? 'bg-blue-900' :
                                              cred.platform === 'GitHub' ? 'bg-stone-800' :
                                              cred.platform === 'Douban' ? 'bg-green-600' : 'bg-stone-400'}
                                        `}>
                                            {cred.platform[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-stone-800 dark:text-stone-100">{cred.name}</h3>
                                                {cred.status === 'active' && <Check size={14} className="text-emerald-500" />}
                                                {cred.status === 'error' && <AlertTriangle size={14} className="text-amber-500" />}
                                                {cred.status === 'expired' && <X size={14} className="text-rose-500" />}
                                            </div>
                                            <div className="text-xs text-stone-500 flex items-center gap-2">
                                                <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded">{cred.type}</span>
                                                <span>Last sync: {cred.lastSync || 'Never'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleSyncCredential(cred.id)}
                                            disabled={syncingCreds.has(cred.id)}
                                            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw size={14} className={syncingCreds.has(cred.id) ? 'animate-spin' : ''} />
                                            {syncingCreds.has(cred.id) ? 'Syncing...' : 'Sync Now'}
                                        </button>
                                        <button onClick={() => setEditingCredential(cred)} className="p-2 text-stone-400 hover:text-stone-600"><Edit2 size={16} /></button>
                                        <button onClick={() => deleteCredential(cred.id)} className="p-2 text-stone-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Job Logs */}
                        {syncJobs.length > 0 && (
                            <div className="bg-stone-900 rounded-xl p-4 font-mono text-xs text-stone-300 border border-stone-800">
                                <h4 className="flex items-center gap-2 text-stone-500 uppercase tracking-widest font-bold mb-4 border-b border-stone-800 pb-2">
                                    <Terminal size={14} /> System Logs
                                </h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                    {syncJobs.map(job => (
                                        <div key={job.id} className="border-l-2 border-stone-700 pl-3">
                                            <div className="flex justify-between text-stone-500 mb-1">
                                                <span>Job ID: {job.id}</span>
                                                <span>{new Date(job.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="mb-1 text-emerald-400 font-bold">
                                                Target: {job.platform} <span className={job.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}>[{job.status.toUpperCase()}]</span>
                                            </div>
                                            <div className="space-y-0.5 text-stone-400 opacity-80">
                                                {job.logs.map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SectionContainer>
        )}

        {/* --- ARTICLES (Existing) --- */}
        {activeTab === 'posts' && (
          <SectionContainer title="Articles" onAdd={() => { setEditingPost({}); setUploadQueue([]); setManualUrl(''); }}>
             {/* ... existing code ... */}
             {editingPost ? (
              <EditForm title={editingPost.id ? 'Edit Article' : 'New Article'} onSave={handleSavePost} onCancel={() => setEditingPost(null)}>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-4">
                        <Input label="Title" value={editingPost.title} onChange={v => setEditingPost({...editingPost, title: v})} />
                        <TextArea label="Excerpt / Content" value={editingPost.excerpt} onChange={v => setEditingPost({...editingPost, excerpt: v})} />
                     </div>
                     <div className="lg:col-span-1 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Cover Image</label>
                            <ImageUploadArea 
                                queue={uploadQueue} 
                                onDrop={handleDrop} 
                                onFileSelect={handleFileSelect} 
                                onRemove={removeFileFromQueue} 
                                currentImageUrl={editingPost.imageUrl}
                                isDragOver={isDragOver}
                                setIsDragOver={setIsDragOver}
                                multiple={false}
                                manualUrl={manualUrl}
                                setManualUrl={setManualUrl}
                            />
                        </div>
                        <Input label="Category" value={editingPost.category} onChange={v => setEditingPost({...editingPost, category: v})} />
                        <Input label="Read Time" value={editingPost.readTime} onChange={v => setEditingPost({...editingPost, readTime: v})} />
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tags</label>
                            <Input value={editingPost.tags?.join(', ')} onChange={v => setEditingPost({...editingPost, tags: v.split(',').map(s => s.trim())})} />
                        </div>
                     </div>
                 </div>
              </EditForm>
            ) : (
                <ListContainer>
                    {posts.map(post => (
                        <RichPostItem 
                            key={post.id} 
                            post={post} 
                            onEdit={() => setEditingPost(post)} 
                            onDelete={() => deletePost(post.id)} 
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
                                <TextArea label="What's happening?" value={editingMoment.content} onChange={v => setEditingMoment({...editingMoment, content: v})} />
                                <Input label="Tags (Comma separated)" value={editingMoment.tags?.join(', ')} onChange={v => setEditingMoment({...editingMoment, tags: v.split(',').map(s => s.trim()).filter(Boolean)})} />
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
                                        setEditingMoment({...editingMoment, images: newImages});
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

        {/* ... Rest of tabs (projects, curated, gallery, hero, data) included to maintain file integrity ... */}
        {activeTab === 'projects' && (
             <SectionContainer title="Projects" onAdd={() => setEditingProject({})}>
                {editingProject ? (
                    <EditForm title={editingProject.id ? 'Edit Project' : 'New Project'} onSave={handleSaveProject} onCancel={() => setEditingProject(null)}>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Title" value={editingProject.title} onChange={v => setEditingProject({...editingProject, title: v})} />
                            <Input label="Role" value={editingProject.role} onChange={v => setEditingProject({...editingProject, role: v})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Year" value={editingProject.year} onChange={v => setEditingProject({...editingProject, year: v})} />
                             <Input label="Date" value={editingProject.date} onChange={v => setEditingProject({...editingProject, date: v})} />
                        </div>
                        <TextArea label="Description" value={editingProject.description} onChange={v => setEditingProject({...editingProject, description: v})} />
                        <Input label="Image URL" value={editingProject.imageUrl} onChange={v => setEditingProject({...editingProject, imageUrl: v})} />
                        <div className="grid grid-cols-2 gap-4">
                             <Input label="Demo URL" value={editingProject.demoUrl} onChange={v => setEditingProject({...editingProject, demoUrl: v})} />
                             <Input label="Repo URL" value={editingProject.repoUrl} onChange={v => setEditingProject({...editingProject, repoUrl: v})} />
                        </div>
                        <Input label="Technologies (Comma separated)" value={editingProject.technologies?.join(', ')} onChange={v => setEditingProject({...editingProject, technologies: v.split(',').map(s => s.trim())})} />
                        <Input label="Features (Comma separated)" value={editingProject.features?.join(', ')} onChange={v => setEditingProject({...editingProject, features: v.split(',').map(s => s.trim())})} />
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
        
        {/* Simplified inclusion for other sections to keep response length manageable, but logic implies full file rewrite */}
        {activeTab === 'curated' && (
            <SectionContainer title="Curated Links" onAdd={() => setEditingShare({})}>
                 {editingShare ? (
                    <EditForm title={editingShare.id ? 'Edit Share' : 'New Share'} onSave={handleSaveShare} onCancel={() => setEditingShare(null)}>
                        <Input label="Title" value={editingShare.title} onChange={v => setEditingShare({...editingShare, title: v})} />
                        <Input label="URL" value={editingShare.url} onChange={v => setEditingShare({...editingShare, url: v})} />
                        <TextArea label="Description" value={editingShare.description} onChange={v => setEditingShare({...editingShare, description: v})} />
                        <Input label="Domain (Optional)" value={editingShare.domain} onChange={v => setEditingShare({...editingShare, domain: v})} />
                        <Input label="Image URL (Optional)" value={editingShare.imageUrl} onChange={v => setEditingShare({...editingShare, imageUrl: v})} />
                        <Input label="Tags" value={editingShare.tags?.join(', ')} onChange={v => setEditingShare({...editingShare, tags: v.split(',').map(s => s.trim())})} />
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

        {/* ... Include Gallery, Hero, Data sections exactly as they were ... */}
        {activeTab === 'gallery' && (
             <SectionContainer title="Gallery" onAdd={() => { setEditingGallery({}); setUploadQueue([]); setIsBatchMode(false); setManualUrl(''); }}>
                {editingGallery ? (
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                {editingGallery.id ? 'Edit Image Info' : 'Upload Media'}
                            </h3>
                            <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
                        </div>

                        {!editingGallery.id && (
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
                            {!editingGallery.id && (
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

                            <div className={`${!editingGallery.id ? 'col-span-1 lg:col-span-2' : 'col-span-full'}`}>
                                <div className="space-y-4">
                                    {!editingGallery.id && isBatchMode ? (
                                        <Input 
                                            label="Batch Name Prefix" 
                                            value={editingGallery.title} 
                                            onChange={v => setEditingGallery({...editingGallery, title: v})} 
                                        />
                                    ) : (
                                        <Input 
                                            label="Title" 
                                            value={editingGallery.title} 
                                            onChange={v => setEditingGallery({...editingGallery, title: v})} 
                                        />
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Date" value={editingGallery.date} onChange={v => setEditingGallery({...editingGallery, date: v})} />
                                        <Input label="Location" value={editingGallery.location} onChange={v => setEditingGallery({...editingGallery, location: v})} />
                                    </div>

                                    <TextArea label="Description (Shared)" value={editingGallery.description} onChange={v => setEditingGallery({...editingGallery, description: v})} />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => { setEditingGallery(null); setUploadQueue([]); }} className="px-6 py-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">Cancel</button>
                                    <button 
                                        onClick={handleSaveGallery}
                                        disabled={!editingGallery.id && uploadQueue.length === 0 && !editingGallery.url} 
                                        className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        {editingGallery.id ? 'Update Info' : `Upload ${uploadQueue.length > 0 ? `(${uploadQueue.length})` : ''}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryItems.map(item => (
                            <div key={item.id} className="relative group rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 aspect-square">
                                <img src={item.type === 'video' ? item.thumbnail : item.url} className="w-full h-full object-cover" />
                                {item.type === 'video' && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"><Play size={12} /></div>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => setEditingGallery(item)} className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Edit2 size={16} /></button>
                                    <button onClick={() => deleteGalleryItem(item.id)} className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 size={16} /></button>
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

        {/* --- HERO & DATA SECTIONS (Include existing) --- */}
        {activeTab === 'hero' && (
             <SectionContainer title="Hero Shuffle Grid" onAdd={() => {}}>
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
                     {heroImages.map((src, idx) => (
                         <div key={idx} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-200 dark:bg-stone-800">
                             <img src={src} className="w-full h-full object-cover" />
                             <button onClick={() => handleRemoveHeroImage(idx)} className="absolute top-2 right-2 p-1 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                 <X size={14} />
                             </button>
                         </div>
                     ))}
                 </div>
             </SectionContainer>
        )}
        
        {activeTab === 'data' && (
             <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 space-y-8">
                 {/* ... existing Data code ... */}
                 <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Life Log Data</h2>
                 <DataSection title="Skills" icon={<Layers size={18} />}>
                     <div className="space-y-3">
                        {skillData.map((skill, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input value={skill.name} onChange={v => { const n = [...skillData]; n[idx].name = v; updateSkillData(n); }} />
                                <div className="w-24"><Input type="number" value={skill.level.toString()} onChange={v => { const n = [...skillData]; n[idx].level = Number(v); updateSkillData(n); }} /></div>
                            </div>
                        ))}
                     </div>
                 </DataSection>

                 <DataSection title="Game Stats (Radar)" icon={<Database size={18} />}>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {gameData.map((g, idx) => (
                             <div key={idx} className="p-3 border rounded bg-stone-50 dark:bg-stone-900 dark:border-stone-800">
                                 <div className="text-xs font-bold mb-2 text-stone-500">{g.subject}</div>
                                 <Input type="number" label="Value" value={g.A.toString()} onChange={v => { const n = [...gameData]; n[idx].A = Number(v); updateGameData(n); }} />
                             </div>
                         ))}
                     </div>
                 </DataSection>

                 <DataSection title="Weekly Routine (Pie)" icon={<Database size={18} />}>
                     <div className="space-y-3">
                         {routineData.map((r, idx) => (
                             <div key={idx} className="flex gap-2 items-center">
                                 <div className="w-6 h-6 rounded border border-stone-200" style={{backgroundColor: r.color}}></div>
                                 <Input value={r.name} onChange={v => { const n = [...routineData]; n[idx].name = v; updateRoutineData(n); }} />
                                 <div className="w-24"><Input type="number" value={r.value.toString()} onChange={v => { const n = [...routineData]; n[idx].value = Number(v); updateRoutineData(n); }} /></div>
                             </div>
                         ))}
                     </div>
                 </DataSection>

                 <DataSection title="Daily Steps" icon={<Database size={18} />}>
                     <div className="grid grid-cols-7 gap-2">
                         {stepsData.map((s, idx) => (
                             <div key={idx} className="text-center">
                                 <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                                 <Input type="number" value={s.steps.toString()} onChange={v => { const n = [...stepsData]; n[idx].steps = Number(v); updateStepsData(n); }} />
                             </div>
                         ))}
                     </div>
                 </DataSection>

                 <DataSection title="Photo Stats" icon={<Database size={18} />}>
                     <div className="grid grid-cols-7 gap-2">
                         {photoStats.map((s, idx) => (
                             <div key={idx} className="text-center">
                                 <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                                 <Input type="number" value={s.count.toString()} onChange={v => { const n = [...photoStats]; n[idx].count = Number(v); updatePhotoStats(n); }} />
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
                                    <Input type="number" label="Mov" value={m.movies.toString()} onChange={v => { const n = [...movieData]; n[idx].movies = Number(v); updateMovieData(n); }} />
                                    <Input type="number" label="Ser" value={m.series.toString()} onChange={v => { const n = [...movieData]; n[idx].series = Number(v); updateMovieData(n); }} />
                                 </div>
                             </div>
                         ))}
                     </div>
                 </DataSection>
             </div>
        )}

      </main>
    </div>
  );
};

// --- Helper Components & Sections (Include existing) ---
const ImageUploadArea: React.FC<{
    queue: {file: File, preview: string}[],
    onDrop: (e: React.DragEvent) => void,
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: (idx: number) => void,
    isDragOver: boolean,
    setIsDragOver: (v: boolean) => void,
    multiple: boolean,
    currentImageUrl?: string,
    existingImages?: string[],
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

                {existingImages && existingImages.map((src, idx) => (
                     <div key={`exist-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <img src={src} className="w-full h-full object-cover" />
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

const RichPostItem: React.FC<{ post: BlogPost, onEdit: () => void, onDelete: () => void }> = ({ post, onEdit, onDelete }) => (
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

const RichMomentItem: React.FC<{ moment: Moment, onEdit: () => void, onDelete: () => void }> = ({ moment, onEdit, onDelete }) => (
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
                 {moment.images.map((src, idx) => (
                     <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                         <img src={src} className="w-full h-full object-cover" />
                     </div>
                 ))}
             </div>
         )}
    </div>
);

// ... Include other helper components (NavBtn, SectionContainer, ListContainer, ListItem, ActionBtn, EditForm, Input, TextArea, DataSection, OverviewSection, TrafficStatsSection) exactly as they were in the previous file version.
// For brevity in this diff, I am ensuring the core changes to "Friends" section and imports are applied.

const NavBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${active ? 'bg-sage-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
    >
        {icon} <span>{label}</span>
    </button>
);

const SectionContainer: React.FC<{ title: string, children: React.ReactNode, onAdd: () => void }> = ({ title, children, onAdd }) => (
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

const ListContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid gap-3">{children}</div>
);

const ListItem: React.FC<{ title: string, subtitle?: string, image?: string, onEdit: () => void, onDelete: () => void }> = ({ title, subtitle, image, onEdit, onDelete }) => (
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

const ActionBtn: React.FC<{ onClick: () => void, icon: React.ReactNode, danger?: boolean }> = ({ onClick, icon, danger }) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors ${danger ? 'text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
    >
        {icon}
    </button>
);

const EditForm: React.FC<{ title: string, children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ title, children, onSave, onCancel }) => (
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

const Input: React.FC<{ label?: string, value?: string, onChange: (val: string) => void, type?: string }> = ({ label, value, onChange, type = "text" }) => (
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

const TextArea: React.FC<{ label?: string, value?: string, onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div>
        {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{label}</label>}
        <textarea 
            className="w-full p-3 border rounded-lg h-32 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm resize-none"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

const DataSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-stone-800 dark:text-stone-200 pb-4 border-b border-stone-100 dark:border-stone-800">
            {icon} {title}
        </h3>
        {children}
    </div>
);

const OverviewSection: React.FC<{ 
    posts: BlogPost[], 
    moments: Moment[], 
    galleryItems: GalleryItem[], 
    projects: Project[],
    shareItems: ShareItem[],
    onQuickAction: (tab: Tab) => void
}> = ({ posts, moments, galleryItems, projects, shareItems, onQuickAction }) => {
    // ... Copy of OverviewSection ...
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
    ].sort(() => Math.random() - 0.5).slice(0, 4);

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Dashboard Overview</h2>
                    <p className="text-stone-500 dark:text-stone-400">Welcome back. Here is what's happening today.</p>
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
                                    cursor={{fill: 'transparent'}}
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

const TrafficStatsSection: React.FC<{
    trafficData: TrafficData[],
    sourceData: SourceData[],
    pageVisitData: PageVisitData[],
    deviceData: DeviceData[]
}> = ({ trafficData, sourceData, pageVisitData, deviceData }) => {
    // ... Copy of TrafficStatsSection ...
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
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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

export default AdminDashboard;
