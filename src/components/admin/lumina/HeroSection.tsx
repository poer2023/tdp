"use client";

import React, { useState } from 'react';
import { X, Link2, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { useData } from './store';
import { AdminImage } from '../AdminImage';
import { useAdminLocale } from './useAdminLocale';

type InputMode = 'url' | 'gallery';

export const HeroSection: React.FC = () => {
    const { heroImages, addHeroImage, deleteHeroImage, galleryItems, loading } = useData();
    const { t } = useAdminLocale();
    const [newHeroImage, setNewHeroImage] = useState('');
    const [inputMode, setInputMode] = useState<InputMode>('gallery');
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [selectedGalleryIds, setSelectedGalleryIds] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);

    // Get existing hero image URLs to filter out from gallery
    const existingUrls = new Set(heroImages.map(h => h.url));

    // Filter gallery items that aren't already in hero images
    const availableGalleryItems = galleryItems.filter(g => {
        const url = g.filePath || g.url;
        return url && !existingUrls.has(url);
    });

    const handleAddFromUrl = async () => {
        if (!newHeroImage.trim()) return;
        setIsAdding(true);
        try {
            await addHeroImage({
                url: newHeroImage.trim(),
                sortOrder: heroImages.length,
                active: true
            });
            setNewHeroImage('');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddFromGallery = async () => {
        if (selectedGalleryIds.size === 0) return;
        setIsAdding(true);
        try {
            const selectedItems = galleryItems.filter(g => selectedGalleryIds.has(g.id));
            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const url = item.filePath || item.url;
                if (url) {
                    await addHeroImage({
                        url,
                        sortOrder: heroImages.length + i,
                        active: true
                    });
                }
            }
            setSelectedGalleryIds(new Set());
            setShowGalleryPicker(false);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveHeroImage = async (id: string) => {
        await deleteHeroImage(id);
    };

    const toggleGallerySelection = (id: string) => {
        setSelectedGalleryIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('heroShuffleGrid')}</h2>
                </div>
            </div>

            {/* Input Mode Tabs */}
            <div className="mb-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => { setInputMode('gallery'); setShowGalleryPicker(true); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            inputMode === 'gallery'
                                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                        }`}
                    >
                        <ImageIcon size={16} />
                        {t('fromGallery')}
                    </button>
                    <button
                        onClick={() => { setInputMode('url'); setShowGalleryPicker(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            inputMode === 'url'
                                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                        }`}
                    >
                        <Link2 size={16} />
                        {t('fromUrl')}
                    </button>
                </div>

                {/* URL Input */}
                {inputMode === 'url' && (
                    <div className="flex gap-2">
                        <input
                            className="flex-1 p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 transition-all"
                            placeholder={t('pasteImageUrl')}
                            value={newHeroImage}
                            onChange={e => setNewHeroImage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddFromUrl()}
                        />
                        <button
                            onClick={handleAddFromUrl}
                            disabled={!newHeroImage.trim() || isAdding}
                            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 rounded-lg font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {isAdding ? <Loader2 size={16} className="animate-spin" /> : null}
                            {t('add')}
                        </button>
                    </div>
                )}

                {/* Gallery Picker */}
                {inputMode === 'gallery' && showGalleryPicker && (
                    <div>
                        {loading.gallery ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-stone-400" />
                            </div>
                        ) : availableGalleryItems.length === 0 ? (
                            <div className="text-center py-12 text-stone-500">
                                <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                                <p>No available images in gallery</p>
                                <p className="text-sm mt-1">Upload images to gallery first or all images are already added</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
                                    {availableGalleryItems.map((item) => {
                                        const isSelected = selectedGalleryIds.has(item.id);
                                        const thumbUrl = item.smallThumbPath || item.microThumbPath || item.filePath || item.url;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleGallerySelection(item.id)}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                                        : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                                                }`}
                                            >
                                                <AdminImage
                                                    src={thumbUrl}
                                                    alt={item.title || ''}
                                                    className="w-full h-full"
                                                    containerClassName="w-full h-full"
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                        <div className="bg-emerald-500 rounded-full p-1">
                                                            <Check size={12} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedGalleryIds.size > 0 && (
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                        <span className="text-sm text-stone-500">
                                            {selectedGalleryIds.size} image{selectedGalleryIds.size > 1 ? 's' : ''} selected
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedGalleryIds(new Set())}
                                                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={handleAddFromGallery}
                                                disabled={isAdding}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isAdding ? <Loader2 size={14} className="animate-spin" /> : null}
                                                Add Selected
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Current Hero Images */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4">
                    Current Hero Images ({heroImages.length})
                </h3>
                {heroImages.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                        <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No hero images yet</p>
                        <p className="text-sm mt-1">Add images from gallery or paste a URL above</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {heroImages.map((img) => (
                            <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-200 dark:bg-stone-800">
                                <AdminImage src={img.url} alt="" className="w-full h-full" containerClassName="w-full h-full" />
                                <button
                                    onClick={() => handleRemoveHeroImage(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                                >
                                    <X size={14} />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white/80 truncate block">#{img.sortOrder + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroSection;
