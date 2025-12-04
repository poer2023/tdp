
import React, { useState, useMemo, useEffect } from 'react';
import Hero from './Hero';
import PostCard from './PostCard';
import MomentCard from './MomentCard';
import ShareCard from './ShareCard';
import MomentDetail from './MomentDetail';
import PostDetail from './PostDetail';
import { CompactStatusWidget, ProfileWidget } from './SideWidgets';
import { FeedFilter, FeedItem, Moment, BlogPost } from '../types';
import { useData, useSettings } from '../store';
import SEO from './SEO';
import { Loader2, ArrowDown } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

const HomePage: React.FC = () => {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('All');
  const { posts, moments, shareItems } = useData();
  const { t } = useSettings();
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [feedFilter]);

  // Optimized: Use useMemo to prevent recalculating the feed on every render
  const fullFeed = useMemo(() => {
    let items: FeedItem[] = [];

    if (feedFilter === 'All') {
        // Interleave posts, moments, and shares
        items = [
            ...posts.map(p => ({ ...p, type: 'article' as const })),
            ...moments,
            ...shareItems
        ];
        // In a real app, sort by actual date object
        items.sort((a, b) => 0.5 - Math.random()); // Simple shuffle for demo
    } else if (feedFilter === 'Articles') {
        items = posts.map(p => ({ ...p, type: 'article' as const }));
    } else if (feedFilter === 'Moments') {
        items = moments;
    } else if (feedFilter === 'Curated') {
        items = shareItems;
    }
    return items;
  }, [feedFilter, posts, moments, shareItems]);

  // Slice the data for display based on pagination
  const visibleItems = useMemo(() => {
      return fullFeed.slice(0, visibleCount);
  }, [fullFeed, visibleCount]);

  const hasMore = visibleCount < fullFeed.length;

  const handleLoadMore = () => {
      setIsLoadingMore(true);
      // Simulate network delay for better UX feel
      setTimeout(() => {
          setVisibleCount(prev => prev + ITEMS_PER_PAGE);
          setIsLoadingMore(false);
      }, 600);
  };

  return (
    <>
      <SEO title="Home" description="Welcome to Lumina Space. A personal digital garden sharing daily life, photography and tech." />
      
      {/* Detail Modals */}
      {selectedMoment && (
          <MomentDetail 
             moment={selectedMoment} 
             onClose={() => setSelectedMoment(null)} 
          />
      )}

      {selectedPost && (
          <PostDetail
             post={selectedPost}
             onClose={() => setSelectedPost(null)} 
          />
      )}

      <Hero />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Feed (2/3 width) */}
            <div className="w-full lg:w-2/3">
                <div className="flex items-center justify-between mb-8 sticky top-16 z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0 transition-colors">
                        {/* Filter Pills */}
                        <div className="flex bg-white dark:bg-stone-900 p-1 rounded-full border border-stone-200 dark:border-stone-800 shadow-sm overflow-x-auto max-w-full">
                        {(['All', 'Articles', 'Moments', 'Curated'] as FeedFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setFeedFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                    feedFilter === filter 
                                    ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-md' 
                                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                                }`}
                            >
                                {t(filter)}
                            </button>
                        ))}
                        </div>
                        <span className="hidden sm:block text-xs text-stone-400 font-bold uppercase tracking-widest border-b border-stone-200 dark:border-stone-800 pb-1">
                            {t(feedFilter === 'All' ? 'Mixed Feed' : feedFilter)}
                        </span>
                </div>
                
                {/* Feed Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 columns-1 md:columns-2 gap-8 space-y-8 mb-12">
                    {visibleItems.map((item) => (
                        <React.Fragment key={item.id}>
                            {item.type === 'article' ? (
                                <PostCard 
                                    post={item} 
                                    onClick={() => setSelectedPost(item)}
                                />
                            ) : item.type === 'moment' ? (
                                <MomentCard 
                                    moment={item} 
                                    onClick={() => setSelectedMoment(item)}
                                />
                            ) : (
                                <ShareCard 
                                    item={item}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    
                    {visibleItems.length === 0 && (
                        <div className="break-inside-avoid text-center py-20 bg-white dark:bg-stone-900 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 transition-colors col-span-full">
                        <p className="text-stone-400">{t('No content found here yet.')}</p>
                        </div>
                    )}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="flex justify-center pb-8">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="group flex items-center gap-2 px-8 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full text-stone-600 dark:text-stone-300 font-medium hover:border-sage-400 hover:text-sage-600 dark:hover:text-sage-400 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                        >
                            {isLoadingMore ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                            )}
                            {isLoadingMore ? 'Loading...' : t('Read More')}
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column: Widgets (1/3 width) - Sticky */}
            <div className="w-full lg:w-1/3">
                <div className="sticky top-24 space-y-6">
                    {/* Profile Widget */}
                    <ProfileWidget />

                    {/* Consolidated Compact Status Widget */}
                    <CompactStatusWidget />
                    
                    <div className="pt-8 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-400 text-center lg:text-left">
                        <p>{t('Designed with')} ❤️ & ☕</p>
                        <p className="mt-1">© 2023 Lumina Space</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
